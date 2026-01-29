import PDFDocument = require("pdfkit");
import { Response } from "express";
import { IzvestajPerformanse } from "../Domain/models/IzvestajPerformanse";

export class PdfService {
  /**
   * Fallback: PDFKit default fontovi ne podržavaju latin-ext,
   * pa normalizujemo čćšđž -> ccsdjz da se ne pojavljuju čudni simboli.
   */
  private static normalizeText(input: string): string {
    if (!input) return "";

    return input
      .replace(/č/g, "c")
      .replace(/ć/g, "c")
      .replace(/š/g, "s")
      .replace(/đ/g, "dj")
      .replace(/ž/g, "z")
      .replace(/Č/g, "C")
      .replace(/Ć/g, "C")
      .replace(/Š/g, "S")
      .replace(/Đ/g, "Dj")
      .replace(/Ž/g, "Z");
  }

  /**
   * STREAM varijanta: direktno piše PDF u response.
   */
  static streamIzvestajPdf(res: Response, izvestaj: IzvestajPerformanse) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Bitno: prvo pipe, pa onda sadržaj
    doc.pipe(res);

    // Koristimo samo ugrađeni font
    doc.font("Helvetica");

    PdfService.fillPdf(doc, izvestaj);

    doc.end();
  }

  /**
   * BUFFER varijanta: vraća Promise<Buffer>
   */
  static generateIzvestajPdf(izvestaj: IzvestajPerformanse): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));

        // Koristimo samo ugrađeni font i OVDE
        doc.font("Helvetica");

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
    doc.font("Helvetica").fontSize(18).text(PdfService.normalizeText("Izveštaj performansi"), {
      align: "center",
    });
    doc.moveDown();

    // OSNOVNI PODACI
    doc.fontSize(12);
    doc.text(`Naziv izveštaja: ${PdfService.normalizeText(izvestaj.nazivIzvestaja)}`);
    doc.text(`Algoritam: ${PdfService.normalizeText(izvestaj.algoritam)}`);
    doc.text(
      `Datum kreiranja: ${new Date(izvestaj.datumKreiranja).toLocaleString()}`
    );
    doc.moveDown();

    // REZULTATI
    doc.fontSize(14).text(PdfService.normalizeText("Rezultati"), { underline: true });
    doc.moveDown(0.5);

    let rezultatiTekst = izvestaj.rezultatiJson;
    try {
      const obj = JSON.parse(izvestaj.rezultatiJson);
      rezultatiTekst = JSON.stringify(obj, null, 2);
    } catch {
      // ostaje string
    }

    // JSON normalizujemo da ne puknu slova
    doc.fontSize(10).text(PdfService.normalizeText(rezultatiTekst), {
      width: 500,
      lineGap: 2,
    });

    doc.moveDown();

    // ZAKLJUCAK (bez kvačica da ne bude "Zaklju Ö")
    doc.fontSize(14).text(PdfService.normalizeText("Zaključak"), { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(PdfService.normalizeText(izvestaj.zakljucak), {
      width: 500,
      lineGap: 2,
    });
  }
}
