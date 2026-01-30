import PDFDocument from "pdfkit";
//staro import PDFDocument = require("pdfkit");

import { Response } from "express";

export type IzvestajAnalizePdf = {
  datumKreiranja: string;

  ukupnaProdaja: number;
  ukupnoKomada: number;

  // opcionalno – ako proslediš query
  period?: {
    start: string;
    end: string;
    ukupnaProdaja: number;
    ukupnoKomada: number;
  };

  godisnja?: {
    godina: number;
    ukupno: number;
    ukupnoKomada: number;
  };

  mesecna?: {
    godina: number;
    prodaja: { mesec: number; ukupno: number }[];
    komadi: { mesec: number; ukupnoKomada: number }[];
  };

  trend?: { datum: string; ukupno: number }[];

  top10Kolicina: { parfemNaziv: string; kolicina: number }[];
  top10Prihod: { parfemNaziv: string; prihod: number }[];
  ukupanPrihodTop10: number;
};

export class AnalyticsPdfService {
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

  static streamIzvestajPdf(res: Response, izvestaj: IzvestajAnalizePdf) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // headeri pre pipe-a (sigurnije)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="izvestaj_analize_${Date.now()}.pdf"`
    );

    doc.pipe(res);
    doc.font("Helvetica");

    AnalyticsPdfService.fillPdf(doc, izvestaj);

    doc.end();
  }

  private static fillPdf(doc: PDFKit.PDFDocument, izvestaj: IzvestajAnalizePdf) {
    // NASLOV
    doc
      .font("Helvetica")
      .fontSize(18)
      .text(AnalyticsPdfService.normalizeText("Izvestaj analize prodaje"), {
        align: "center",
      });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(
      `Datum kreiranja: ${AnalyticsPdfService.normalizeText(izvestaj.datumKreiranja)}`
    );
    doc.moveDown();

    // OSNOVNO
    doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Osnovni pokazatelji"), {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Ukupna prodaja (RSD): ${izvestaj.ukupnaProdaja.toFixed(2)}`);
    doc.text(`Ukupno prodatih komada: ${izvestaj.ukupnoKomada}`);
    doc.moveDown();

    // PERIOD (ako postoji)
    if (izvestaj.period) {
      doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Period (start-end)"), {
        underline: true,
      });
      doc.moveDown(0.5);

      doc.fontSize(12).text(
        `Period: ${AnalyticsPdfService.normalizeText(izvestaj.period.start)} - ${AnalyticsPdfService.normalizeText(
          izvestaj.period.end
        )}`
      );
      doc.text(`Prodaja u periodu (RSD): ${izvestaj.period.ukupnaProdaja.toFixed(2)}`);
      doc.text(`Komada u periodu: ${izvestaj.period.ukupnoKomada}`);
      doc.moveDown();
    }

    // GODISNJA (ako postoji)
    if (izvestaj.godisnja) {
      doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Godisnja analiza"), {
        underline: true,
      });
      doc.moveDown(0.5);

      doc.fontSize(12).text(`Godina: ${izvestaj.godisnja.godina}`);
      doc.text(`Ukupno (RSD): ${izvestaj.godisnja.ukupno.toFixed(2)}`);
      doc.text(`Ukupno komada: ${izvestaj.godisnja.ukupnoKomada}`);
      doc.moveDown();
    }

    // MESECNA (ako postoji)
    if (izvestaj.mesecna) {
      doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Mesecna analiza"), {
        underline: true,
      });
      doc.moveDown(0.5);

      doc.fontSize(12).text(`Godina: ${izvestaj.mesecna.godina}`);
      doc.moveDown(0.5);

      doc.fontSize(12).text(AnalyticsPdfService.normalizeText("Prodaja po mesecima (RSD):"));
      doc.moveDown(0.25);
      doc.fontSize(10);

      if (!izvestaj.mesecna.prodaja?.length) {
        doc.text("Nema podataka.");
      } else {
        for (const p of izvestaj.mesecna.prodaja) {
          doc.text(`Mesec ${p.mesec}: ${Number(p.ukupno).toFixed(2)}`);
        }
      }

      doc.moveDown(0.5);
      doc.fontSize(12).text(AnalyticsPdfService.normalizeText("Komadi po mesecima:"));
      doc.moveDown(0.25);
      doc.fontSize(10);

      if (!izvestaj.mesecna.komadi?.length) {
        doc.text("Nema podataka.");
      } else {
        for (const k of izvestaj.mesecna.komadi) {
          doc.text(`Mesec ${k.mesec}: ${Number(k.ukupnoKomada)}`);
        }
      }

      doc.moveDown();
    }

    // TREND (ako postoji)
    if (izvestaj.trend?.length) {
      doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Trend prodaje"), {
        underline: true,
      });
      doc.moveDown(0.5);

      doc.fontSize(10);
      // ograniči da PDF ne ode u 10 strana
      const maxRows = 31;
      const rows = izvestaj.trend.slice(0, maxRows);

      for (const r of rows) {
        doc.text(`${r.datum}: ${Number(r.ukupno).toFixed(2)} RSD`);
      }

      if (izvestaj.trend.length > maxRows) {
        doc.moveDown(0.25);
        doc.text("... (prikazano prvih 31 dana)");
      }

      doc.moveDown();
    }

    // TOP 10 KOLICINA
    doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Top 10 najprodavanijih parfema"), {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(10);
    if (!izvestaj.top10Kolicina?.length) {
      doc.text("Nema podataka.");
    } else {
      izvestaj.top10Kolicina.forEach((p, i) => {
        doc.text(`${i + 1}. ${AnalyticsPdfService.normalizeText(p.parfemNaziv)} — ${p.kolicina} kom`);
      });
    }

    doc.moveDown();

    // TOP 10 PRIHOD
    doc.fontSize(14).text(AnalyticsPdfService.normalizeText("Top 10 parfema po prihodu"), {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(10);
    if (!izvestaj.top10Prihod?.length) {
      doc.text("Nema podataka.");
    } else {
      izvestaj.top10Prihod.forEach((p, i) => {
        doc.text(
          `${i + 1}. ${AnalyticsPdfService.normalizeText(p.parfemNaziv)} — ${Number(p.prihod).toFixed(2)} RSD`
        );
      });
    }

    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Ukupan prihod (top 10 zbir): ${Number(izvestaj.ukupanPrihodTop10).toFixed(2)} RSD`
    );
  }
}
