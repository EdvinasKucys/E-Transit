-- corrected_schema.ddl
CREATE TABLE Marsrutas
(
    numeris SERIAL PRIMARY KEY,
    pavadinimas VARCHAR(255) NOT NULL,
    pradzios_stotele VARCHAR(255) NOT NULL,
    pabaigos_stotele VARCHAR(255) NOT NULL,
    bendras_atstumas FLOAT,
    trukme INT,
    sukurimo_data DATE,
    atnaujinimo_data DATE
);

CREATE TABLE Naudotojas
(
    id_Naudotojas SERIAL PRIMARY KEY,
    vardas VARCHAR(255),
    pavarde VARCHAR(255),
    gimimo_data DATE,
    miestas VARCHAR(255),
    el_pastas VARCHAR(255),
    slaptazodis VARCHAR(255),
    slapyvardis VARCHAR(255),
    role VARCHAR(50) CHECK(role IN ('Administratorius', 'Vairuotojas', 'Keleivis', 'Kontrolierius'))
);

CREATE TABLE Stotele
(
    pavadinimas VARCHAR(255) PRIMARY KEY,
    adresas VARCHAR(255),
    koordinates_x FLOAT,
    koordinates_y FLOAT,
    tipas VARCHAR(50) CHECK(tipas IN ('Pradzios', 'Tarpine', 'Pabaigos'))
);

CREATE TABLE Darbuotojas
(
    id_Naudotojas INTEGER PRIMARY KEY,
    pasto_kodas VARCHAR(255),
    adresas VARCHAR(255),
    asmens_kodas VARCHAR(255),
    FOREIGN KEY (id_Naudotojas) REFERENCES Naudotojas(id_Naudotojas)
);

CREATE TABLE Vairuotojas
(
    id_Naudotojas INTEGER PRIMARY KEY,
    vairavimo_stazas FLOAT,
    FOREIGN KEY (id_Naudotojas) REFERENCES Darbuotojas(id_Naudotojas)
);

CREATE TABLE Administratorius
(
    id_Naudotojas INTEGER PRIMARY KEY,
    FOREIGN KEY (id_Naudotojas) REFERENCES Darbuotojas(id_Naudotojas)
);

CREATE TABLE Kontrolierius
(
    id_Naudotojas INTEGER PRIMARY KEY,
    FOREIGN KEY (id_Naudotojas) REFERENCES Darbuotojas(id_Naudotojas)
);

CREATE TABLE Keleivis
(
    id_Naudotojas INTEGER PRIMARY KEY,
    id_korteles VARCHAR(255),
    nuolaidos_tipas VARCHAR(50) CHECK(nuolaidos_tipas IN ('Senjoras', 'Studentas', 'Moksleivis', 'Neįgalus asmuo')),
    FOREIGN KEY(id_Naudotojas) REFERENCES Naudotojas(id_Naudotojas)
);

CREATE TABLE Marsruto_stotele
(
    id_marsruto_stotele SERIAL PRIMARY KEY,
    eiles_nr INT,
    atvykimo_laikas TIME,
    isvykimo_laikas TIME,
    atstumas_nuo_pradzios FLOAT,
    fk_stotele_pavadinimas VARCHAR(255) NOT NULL,
    fk_marsrutas_numeris INTEGER NOT NULL,
    FOREIGN KEY(fk_stotele_pavadinimas) REFERENCES Stotele(pavadinimas),
    FOREIGN KEY(fk_marsrutas_numeris) REFERENCES Marsrutas(numeris)
);

CREATE TABLE Tvarkarastis
(
    pavadinimas VARCHAR(255) PRIMARY KEY,
    isvykimo_laikas TIME,
    atvykimo_laikas TIME,
    dienos_tipas VARCHAR(50) CHECK(dienos_tipas IN ('Darbo_diena', 'Savaitgalis', 'Sventine_diena')),
    fk_marsrutas_numeris INTEGER NOT NULL,
    FOREIGN KEY(fk_marsrutas_numeris) REFERENCES Marsrutas(numeris)
);

CREATE TABLE Transporto_priemone
(
    valstybiniai_num VARCHAR(255) PRIMARY KEY,
    rida INT,
    vietu_sk INT,
    kuro_tipas VARCHAR(50) CHECK(kuro_tipas IN ('Benzinas', 'LPG', 'Dyzelinas', 'Elektra')),
    fk_marsrutas_numeris INTEGER,
    fk_vairuotojas_id_naudotojas INTEGER,
    FOREIGN KEY(fk_marsrutas_numeris) REFERENCES Marsrutas(numeris),
    FOREIGN KEY(fk_vairuotojas_id_naudotojas) REFERENCES Vairuotojas(id_Naudotojas)
);

CREATE TABLE Bilietas
(
    id_bilietas SERIAL PRIMARY KEY,
    kaina FLOAT,
    pirkimo_data DATE,
    pazymejimo_laikas TIMESTAMP,
    fk_keleivis_id_naudotojas INTEGER NOT NULL,
    fk_transporto_priemone_valstybiniai_num VARCHAR(255),
    FOREIGN KEY(fk_keleivis_id_naudotojas) REFERENCES Keleivis(id_Naudotojas),
    FOREIGN KEY(fk_transporto_priemone_valstybiniai_num) REFERENCES Transporto_priemone(valstybiniai_num)
);

CREATE TABLE Gedimas
(
    id_gedimas SERIAL PRIMARY KEY,
    data DATE,
    komentaras VARCHAR(255),
    gedimo_tipas VARCHAR(50) CHECK(gedimo_tipas IN ('Interjero', 'Išorės kosmetinis', 'Kitas stambus', 'Kitas smulkus')),
    gedimo_busena VARCHAR(50) CHECK(gedimo_busena IN ('Nesutvarkyta', 'Sutvarkyta')),
    fk_transporto_priemone_valstybiniai_num VARCHAR(255) NOT NULL,
    FOREIGN KEY(fk_transporto_priemone_valstybiniai_num) REFERENCES Transporto_priemone(valstybiniai_num)
);

CREATE TABLE Sanaudos
(
    id_sanaudos SERIAL PRIMARY KEY,
    data DATE,
    nukeliautas_atstumas FLOAT,
    kuro_kiekis FLOAT,
    fk_transporto_priemone_valstybiniai_num VARCHAR(255) NOT NULL,
    FOREIGN KEY(fk_transporto_priemone_valstybiniai_num) REFERENCES Transporto_priemone(valstybiniai_num)
);