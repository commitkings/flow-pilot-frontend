import * as XLSX from "xlsx";

function isXlsxFile(file: File): boolean {
  return (
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  );
}

export function readFileAsCsv(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (isXlsxFile(file)) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_csv(sheet));
        } catch (err) {
          reject(new Error("Failed to read Excel file. Make sure it is a valid .xlsx file."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsText(file);
    }
  });
}

export async function toCsvFile(file: File): Promise<File> {
  if (!isXlsxFile(file)) return file;
  const csv = await readFileAsCsv(file);
  return new File([csv], file.name.replace(/\.xlsx?$/i, ".csv"), { type: "text/csv" });
}

export const IMPORT_ACCEPT = ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Normalise a header or lookup key so that "Bank Name", "bank_name",
 * "bank-name", and "bankname" all map to the same string.
 */
export function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_\-]+/g, "");
}

/**
 * RFC-4180-compliant CSV line splitter.
 * Handles quoted fields that contain commas or escaped double-quotes.
 */
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; } // escaped ""
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
  }
  result.push(field.trim());
  return result;
}

/**
 * Pad account numbers that look like they had a leading zero stripped by Excel.
 * Nigerian NUBAN numbers are always 10 digits — a 9-digit value means Excel
 * dropped the leading zero.
 */
export function fixAccountNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return "0" + digits;
  return digits || raw;
}
