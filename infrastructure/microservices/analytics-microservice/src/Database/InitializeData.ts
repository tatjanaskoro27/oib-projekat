import { DataSource } from "typeorm";
import { FiskalniRacun } from "../Domain/models/FiskalniRacun";
import { FiskalnaStavka } from "../Domain/models/FiskalnaStavka";
import { TipProdaje,NacinPlacanja } from "../Domain/enums/ProdajaEnums";

export async function initializeInitialData(db: DataSource) {
  const racunRepo = db.getRepository(FiskalniRacun);
  const stavkaRepo = db.getRepository(FiskalnaStavka);

  const racuniCount = await racunRepo.count();

  // Ako već ima podataka – ništa ne radimo
  if (racuniCount > 0) {
    console.log("[InitData] Baza već sadrži podatke.");
    return;
  }

  await db.transaction(async (trx) => {
    const rRepo = trx.getRepository(FiskalniRacun);
    const sRepo = trx.getRepository(FiskalnaStavka);

    // === RAČUN 1 ===
    const r1 = await rRepo.save({
      ukupanIznos: 0,
      datum: new Date("2026-01-05"),
      tipProdaje: TipProdaje.MALOPRODAJA,
      nacinPlacanja: NacinPlacanja.GOTOVINA,
    });

    const r1Stavke = [
      sRepo.create({
        racunId: r1.id,
        parfemNaziv: "Dior Sauvage",
        kolicina: 2,
        cenaPoKomadu: 9500,
      }),
      sRepo.create({
        racunId: r1.id,
        parfemNaziv: "Chanel Bleu",
        kolicina: 1,
        cenaPoKomadu: 13500,
      }),
    ];
    await sRepo.save(r1Stavke);

    const r1Ukupno = r1Stavke.reduce(
      (sum, s) => sum + Number(s.cenaPoKomadu) * s.kolicina,
      0
    );
    await rRepo.update(r1.id, { ukupanIznos: r1Ukupno });

    // === RAČUN 2 ===
    const r2 = await rRepo.save({
      ukupanIznos: 0,
      datum: new Date("2026-02-10"),
      tipProdaje: TipProdaje.VELEPRODAJA,
      nacinPlacanja: NacinPlacanja.UPLATA_NA_RACUN,
    });

    const r2Stavke = [
      sRepo.create({
        racunId: r2.id,
        parfemNaziv: "Armani Stronger With You",
        kolicina: 5,
        cenaPoKomadu: 8200,
      }),
      sRepo.create({
        racunId: r2.id,
        parfemNaziv: "Dior Sauvage",
        kolicina: 3,
        cenaPoKomadu: 9000,
      }),
    ];
    await sRepo.save(r2Stavke);

    const r2Ukupno = r2Stavke.reduce(
      (sum, s) => sum + Number(s.cenaPoKomadu) * s.kolicina,
      0
    );
    await rRepo.update(r2.id, { ukupanIznos: r2Ukupno });
  });

  console.log("[InitData] Inicijalni podaci su uspešno ubačeni.");
}
