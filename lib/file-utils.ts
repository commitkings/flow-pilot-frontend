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
