function readUint16(view, offset) {
  return view.getUint16(offset, true);
}

function readUint32(view, offset) {
  return view.getUint32(offset, true);
}

function columnNumberToName(columnNumber) {
  let num = columnNumber;
  let name = "";
  while (num > 0) {
    const remainder = (num - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    num = Math.floor((num - 1) / 26);
  }
  return name;
}

function columnNameToNumber(columnName) {
  let result = 0;
  for (const char of columnName) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }
  return result;
}

function parseCellRef(cellRef) {
  const match = /^([A-Z]+)(\d+)$/.exec(cellRef);
  if (!match) {
    return { columnName: "A", columnNumber: 1, rowNumber: 1 };
  }
  return {
    columnName: match[1],
    columnNumber: columnNameToNumber(match[1]),
    rowNumber: Number(match[2])
  };
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("当前浏览器不支持 DecompressionStream，无法直接解析 .xlsx。");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipXlsx(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder("utf-8");
  let eocdOffset = -1;

  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUint32(view, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error("未识别到有效的 .xlsx ZIP 结构。");
  }

  const totalEntries = readUint16(view, eocdOffset + 10);
  const centralDirectoryOffset = readUint32(view, eocdOffset + 16);
  const files = new Map();
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (readUint32(view, cursor) !== 0x02014b50) {
      throw new Error("ZIP 中央目录损坏。");
    }

    const compressionMethod = readUint16(view, cursor + 10);
    const compressedSize = readUint32(view, cursor + 20);
    const fileNameLength = readUint16(view, cursor + 28);
    const extraLength = readUint16(view, cursor + 30);
    const commentLength = readUint16(view, cursor + 32);
    const localHeaderOffset = readUint32(view, cursor + 42);
    const fileNameStart = cursor + 46;
    const fileName = decoder.decode(bytes.slice(fileNameStart, fileNameStart + fileNameLength));

    files.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset
    });

    cursor = fileNameStart + fileNameLength + extraLength + commentLength;
  }

  async function readFile(fileName) {
    const file = files.get(fileName);
    if (!file) {
      return null;
    }
    const localOffset = file.localHeaderOffset;
    if (readUint32(view, localOffset) !== 0x04034b50) {
      throw new Error(`ZIP 本地头损坏：${fileName}`);
    }
    const fileNameLength = readUint16(view, localOffset + 26);
    const extraLength = readUint16(view, localOffset + 28);
    const dataStart = localOffset + 30 + fileNameLength + extraLength;
    const compressed = bytes.slice(dataStart, dataStart + file.compressedSize);
    if (file.compressionMethod === 0) {
      return decoder.decode(compressed);
    }
    if (file.compressionMethod === 8) {
      return decoder.decode(await inflateRaw(compressed));
    }
    throw new Error(`暂不支持的 ZIP 压缩方式：${file.compressionMethod}`);
  }

  return { readFile, files };
}

function getTextContent(node) {
  return Array.from(node.childNodes).map((child) => child.textContent || "").join("");
}

function parseSharedStrings(xmlText) {
  if (!xmlText) {
    return [];
  }
  const xml = new DOMParser().parseFromString(xmlText, "application/xml");
  return Array.from(xml.getElementsByTagName("si")).map((item) => getTextContent(item));
}

function fillMergedCells(cellMap, merges) {
  for (const merge of merges) {
    const [startRef, endRef] = merge.split(":");
    const start = parseCellRef(startRef);
    const end = parseCellRef(endRef);
    const topLeftValue = cellMap.get(startRef) || "";

    for (let row = start.rowNumber; row <= end.rowNumber; row += 1) {
      for (let column = start.columnNumber; column <= end.columnNumber; column += 1) {
        const ref = `${columnNumberToName(column)}${row}`;
        if (!cellMap.get(ref)) {
          cellMap.set(ref, topLeftValue);
        }
      }
    }
  }
}

function sheetKeywordLines(rows) {
  const keywords = [
    /巴西|Brazil|Brasil|BR/i,
    /空运|海运|小包|专线|3PF|仓储|尾程|air|sea|packet|full/i,
    /KG|kg|CBM|RT|首重|续重|体积重|材积|抛重/i,
    /USD|RMB|CNY|BRL|US\$|R\$/i,
    /最低收费|min charge/i,
    /燃油|偏远|清关|派送|敏感货|电池|附加费/i,
    /有效期|valid|effective/i
  ];

  return rows.filter((row) => keywords.some((pattern) => pattern.test(row.text)));
}

function sheetToAiText(sheet, fileName) {
  const lines = [];
  lines.push(`文件名：${fileName}`);
  lines.push(`生成时间：${new Date().toISOString()}`);
  lines.push("说明：以下内容由 Excel 报价预处理器生成，用于辅助识别货代报价。正式测算仍需使用已确认的 Quote Card。");
  lines.push("");
  lines.push("==============================");
  lines.push(`Sheet：${sheet.name}`);
  lines.push(`行数：${sheet.rowCount}`);
  lines.push(`列数：${sheet.colCount}`);
  lines.push(`是否存在合并单元格：${sheet.merges.length ? "是" : "否"}`);
  if (sheet.merges.length) {
    lines.push("该 Sheet 存在合并单元格，系统已尝试填充。");
  }
  if (sheet.rowCount > 300) {
    lines.push("该 Sheet 超过 300 行，当前只输出前 300 行，建议选择更具体的 Sheet 或区域。");
  }
  lines.push("");
  lines.push("【系统识别到的关键词行】");
  for (const row of sheet.keywordRows) {
    lines.push(`行 ${row.rowNumber}：${row.text}`);
  }
  lines.push("");
  lines.push("【表格内容】");
  for (const row of sheet.rows.slice(0, 300)) {
    lines.push(`行 ${row.rowNumber}：${row.text}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function buildWorkbookAiText(workbookData, selectedSheetNames) {
  const selectedSheets = workbookData.sheets.filter((sheet) => selectedSheetNames.includes(sheet.name));
  return selectedSheets.map((sheet) => sheetToAiText(sheet, workbookData.fileName)).join("\n");
}

export async function parseXlsxFile(file) {
  const archive = await unzipXlsx(await file.arrayBuffer());
  const workbookXml = await archive.readFile("xl/workbook.xml");
  if (!workbookXml) {
    throw new Error("未找到 workbook.xml，无法解析 Excel。");
  }
  const workbookRelsXml = await archive.readFile("xl/_rels/workbook.xml.rels");
  const sharedStringsXml = await archive.readFile("xl/sharedStrings.xml");
  const sharedStrings = parseSharedStrings(sharedStringsXml);

  const workbookDoc = new DOMParser().parseFromString(workbookXml, "application/xml");
  const relsDoc = workbookRelsXml
    ? new DOMParser().parseFromString(workbookRelsXml, "application/xml")
    : null;

  const relMap = new Map();
  if (relsDoc) {
    for (const rel of Array.from(relsDoc.getElementsByTagName("Relationship"))) {
      relMap.set(rel.getAttribute("Id"), rel.getAttribute("Target"));
    }
  }

  const sheets = [];
  const workbookWarnings = [];

  for (const sheetNode of Array.from(workbookDoc.getElementsByTagName("sheet"))) {
    const name = sheetNode.getAttribute("name");
    const relationshipId =
      sheetNode.getAttribute("r:id") ||
      sheetNode.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const target = relMap.get(relationshipId);
    if (!target) {
      continue;
    }

    const normalizedTarget = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\/?/, "")}`;
    const worksheetXml = await archive.readFile(normalizedTarget);
    if (!worksheetXml) {
      continue;
    }

    const worksheetDoc = new DOMParser().parseFromString(worksheetXml, "application/xml");
    const merges = Array.from(worksheetDoc.getElementsByTagName("mergeCell")).map((item) => item.getAttribute("ref"));
    const cellMap = new Map();
    let maxRow = 0;
    let maxCol = 0;

    for (const cell of Array.from(worksheetDoc.getElementsByTagName("c"))) {
      const ref = cell.getAttribute("r");
      if (!ref) {
        continue;
      }
      const { rowNumber, columnNumber } = parseCellRef(ref);
      maxRow = Math.max(maxRow, rowNumber);
      maxCol = Math.max(maxCol, columnNumber);

      let value = "";
      const type = cell.getAttribute("t");
      const valueNode = cell.getElementsByTagName("v")[0];
      const inlineNode = cell.getElementsByTagName("is")[0];
      if (type === "s" && valueNode) {
        value = sharedStrings[Number(valueNode.textContent || 0)] || "";
      } else if (inlineNode) {
        value = getTextContent(inlineNode);
      } else if (valueNode) {
        value = valueNode.textContent || "";
      }
      cellMap.set(ref, value.trim());
    }

    if (merges.length) {
      fillMergedCells(cellMap, merges);
      workbookWarnings.push({
        code: "EXCEL_HAS_MERGED_CELLS",
        severity: "warning",
        message: `Sheet ${name} 存在合并单元格，系统已尝试处理，仍需人工复核。`
      });
    }

    const rows = [];
    for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
      const cells = [];
      for (let columnNumber = 1; columnNumber <= maxCol; columnNumber += 1) {
        const columnName = columnNumberToName(columnNumber);
        const ref = `${columnName}${rowNumber}`;
        const value = cellMap.get(ref);
        if (value) {
          cells.push({ ref, columnName, rowNumber, value });
        }
      }
      if (cells.length) {
        rows.push({
          rowNumber,
          cells,
          text: cells.map((cell) => `${cell.columnName}=${cell.value}`).join(" | ")
        });
      }
    }

    if (rows.length > 300) {
      workbookWarnings.push({
        code: "EXCEL_TOO_LARGE",
        severity: "warning",
        message: `Sheet ${name} 超过 300 行，建议只选择相关 Sheet。`
      });
    }

    sheets.push({
      name,
      rowCount: maxRow,
      colCount: maxCol,
      merges,
      rows,
      keywordRows: sheetKeywordLines(rows)
    });
  }

  return {
    fileName: file.name,
    generatedAt: new Date().toISOString(),
    sheets,
    warnings: workbookWarnings
  };
}
