import PDFDocument = require("pdfkit");
import { Response } from "express";
import { IzvestajPerformanse } from "../Domain/models/IzvestajPerformanse";

export class PdfService {
  /**
   * STREAM varijanta (preporučeno): direktno piše PDF u response.
   * Nema Buffer-a, nema 0B fajlova.
   */
  static streamIzvestajPdf(res: Response, izvestaj: IzvestajPerformanse) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.font("src/Assets/fonts/DejaVuSans.ttf");

    // Bitno: prvo pipe, pa onda sadržaj
    doc.pipe(res);

    PdfService.fillPdf(doc, izvestaj);

    // Završava stream
    doc.end();
  }

  /**
   * BUFFER varijanta: vraća Promise<Buffer> (ako ti treba res.send(buffer)).
   */
  static generateIzvestajPdf(izvestaj: IzvestajPerformanse): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));

        PdfService.fillPdf(doc, izvestaj);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Zajednička logika koja upisuje sadržaj u PDFDocument
   */
  private static fillPdf(doc: PDFKit.PDFDocument, izvestaj: IzvestajPerformanse) {
    // NASLOV
    doc.fontSize(18).text("Izveštaj performansi", { align: "center" });
    doc.moveDown();

    // OSNOVNI PODACI
    doc.fontSize(12);
    doc.text(`Naziv izveštaja: ${izvestaj.nazivIzvestaja}`);
    doc.text(`Algoritam: ${izvestaj.algoritam}`);
    doc.text(
      `Datum kreiranja: ${new Date(izvestaj.datumKreiranja).toLocaleString()}`
    );
    doc.moveDown();

    // REZULTATI
    doc.fontSize(14).text("Rezultati", { underline: true });
    doc.moveDown(0.5);

    let rezultatiTekst = izvestaj.rezultatiJson;
    try {
      const obj = JSON.parse(izvestaj.rezultatiJson);
      rezultatiTekst = JSON.stringify(obj, null, 2);
    } catch {
      // ostaje string
    }

    doc.font("Courier").fontSize(10).text(rezultatiTekst, { width: 500 });
    doc.font("Helvetica");
    doc.moveDown();

    // ZAKLJUČAK
    doc.fontSize(14).text("Zaključak", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(izvestaj.zakljucak);
  }
}
