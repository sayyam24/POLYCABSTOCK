import type { Product } from '@/lib/types'

/** Bump when price list changes — triggers one-time local DB product replace */
export const PRODUCT_CATALOG_VERSION = 'electrotrack-catalog-2026-06-28'

const CATALOG_ENTRIES: Omit<Product, 'id'>[] = [
  {
    category: "GLISS DEEP RECESS COB DOWNLIGHT",
    name: "GLISS DEEP RECESS COB DOWNLIGHT 7W (WHITE HSG) CW/WW/NW",
    sku: "PRD001",
    mrp: 900,
    unitPrice: 437,
    caseLot: 20
  },
  {
    category: "GLISS DEEP RECESS COB DOWNLIGHT",
    name: "GLISS DEEP RECESS COB DOWNLIGHT 12W (WHITE HSG) CW/WW/NW",
    sku: "PRD002",
    mrp: 1200,
    unitPrice: 629,
    caseLot: 20
  },
  {
    category: "GLISS DEEP RECESS COB DOWNLIGHT",
    name: "GLISS DEEP RECESS COB DOWNLIGHT 18W (WHITE HSG) CW/WW/NW",
    sku: "PRD003",
    mrp: 1600,
    unitPrice: 844,
    caseLot: 20
  },
  {
    category: "GLISS DEEP RECESS COB DOWNLIGHT",
    name: "GLISS DEEP RECESS COB DOWNLIGHT 7W (BLACK HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD004",
    mrp: 1000,
    unitPrice: 486,
    caseLot: 20
  },
  {
    category: "GLISS DEEP RECESS COB DOWNLIGHT",
    name: "GLISS DEEP RECESS COB DOWNLIGHT 12W (BLACK HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD005",
    mrp: 1300,
    unitPrice: 672,
    caseLot: 20
  },
  {
    category: "GLISS DEEP RECESS COB DOWNLIGHT",
    name: "GLISS DEEP RECESS COB DOWNLIGHT 18W (BLACK HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD006",
    mrp: 1800,
    unitPrice: 881,
    caseLot: 20
  },
  {
    category: "GLISS DECO COB DOWNLIGHT",
    name: "GLISS DECO COB DOWNLIGHT 7W (BLACK/WHITE HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD007",
    mrp: 1000,
    unitPrice: 463,
    caseLot: 20
  },
  {
    category: "GLISS DECO COB DOWNLIGHT",
    name: "GLISS DECO COB DOWNLIGHT 12W (BLACK/WHITE HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD008",
    mrp: 1300,
    unitPrice: 649,
    caseLot: 20
  },
  {
    category: "GLISS DECO COB DOWNLIGHT",
    name: "GLISS DECO COB DOWNLIGHT 18W (BLACK/WHITE HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD009",
    mrp: 1800,
    unitPrice: 866,
    caseLot: 20
  },
  {
    category: "GLISS COB SURFACE SPOT LIGHT",
    name: "GLISS COB SURFACE SPOT LIGHT 7W (BLACK/WHITE HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD010",
    mrp: 1000,
    unitPrice: 516,
    caseLot: 20
  },
  {
    category: "GLISS COB SURFACE SPOT LIGHT",
    name: "GLISS COB SURFACE SPOT LIGHT 12W (BLACK/WHITE HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD011",
    mrp: 1750,
    unitPrice: 699,
    caseLot: 20
  },
  {
    category: "GLISS COB SURFACE SPOT LIGHT",
    name: "GLISS COB SURFACE SPOT LIGHT 18W (BLACK/WHITE HSG & GM/RG REFLTR) CW/WW/NW",
    sku: "PRD012",
    mrp: 2350,
    unitPrice: 896,
    caseLot: 20
  },
  {
    category: "GLISS COB RECESS/SURFACE TRACK LIGHT",
    name: "GLISS COB TRACK LIGHT 10W (BLACK/WHITE HSG) CW/WW/NW",
    sku: "PRD013",
    mrp: 1599,
    unitPrice: 638,
    caseLot: 10
  },
  {
    category: "GLISS COB RECESS/SURFACE TRACK LIGHT",
    name: "GLISS COB TRACK LIGHT 20W (BLACK/WHITE HSG) CW/WW/NW",
    sku: "PRD014",
    mrp: 2999,
    unitPrice: 911,
    caseLot: 10
  },
  {
    category: "GLISS COB RECESS/SURFACE TRACK LIGHT",
    name: "GLISS COB TRACK LIGHT 30W (BLACK/WHITE HSG) CW/WW/NW",
    sku: "PRD015",
    mrp: 3499,
    unitPrice: 1313,
    caseLot: 10
  },
  {
    category: "GLISS TRACK CHANNEL & CONNECTOR",
    name: "ALUMINIUM RECTANGULAR TRACK LIGHT CHANNEL 1 MTR (BLACK/ WHITE)",
    sku: "PRD016",
    mrp: 1100,
    unitPrice: 323,
    caseLot: 20
  },
  {
    category: "GLISS TRACK CHANNEL & CONNECTOR",
    name: "CONNECTOR FOR TRACK CHANNEL (BLACK/WHITE)",
    sku: "PRD017",
    mrp: 250,
    unitPrice: 65,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC EDGE LIT LED PANEL SLIM 3W CW/WW/NW, RD/SQ",
    sku: "PRD018",
    mrp: 395,
    unitPrice: 136,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC EDGE LIT LED PANEL SLIM 6W CW/WW/NW, RD/SQ",
    sku: "PRD019",
    mrp: 550,
    unitPrice: 191,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC EDGE LIT LED PANEL SLIM 12W CW/WW/NW, RD/SQ",
    sku: "PRD020",
    mrp: 950,
    unitPrice: 298,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC EDGE LIT LED PANEL SLIM 15W CW/WW/NW, RD/SQ",
    sku: "PRD021",
    mrp: 1050,
    unitPrice: 333,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC EDGE LIT LED PANEL SLIM 18W CW/WW/NW, RD/SQ",
    sku: "PRD022",
    mrp: 1450,
    unitPrice: 446,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZYLO SLIM AL LED PANEL 6W RD/SQ CW/WW/NW - NEW",
    sku: "PRD023",
    mrp: 575,
    unitPrice: 268,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZYLO SLIM AL LED PANEL 12W RD/SQ CW/WW/NW - NEW",
    sku: "PRD024",
    mrp: 825,
    unitPrice: 386,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZYLO SLIM AL LED PANEL 15W RD/SQ CW/WW/NW - NEW",
    sku: "PRD025",
    mrp: 925,
    unitPrice: 431,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZYLO SLIM AL LED PANEL 18W RD/SQ CW/WW/NW - NEW",
    sku: "PRD026",
    mrp: 1175,
    unitPrice: 542,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC BACKLIT LED PANEL 5W CW/WW/NW, RD/SQ",
    sku: "PRD027",
    mrp: 500,
    unitPrice: 145,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC BACKLIT LED PANEL 8W CW/WW/NW, RD/SQ",
    sku: "PRD028",
    mrp: 600,
    unitPrice: 189,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC BACKLIT LED PANEL 12W CW/WW/NW, RD/SQ",
    sku: "PRD029",
    mrp: 850,
    unitPrice: 296,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC BACKLIT LED PANEL 15W CW/WW/NW, RD/SQ",
    sku: "PRD030",
    mrp: 1000,
    unitPrice: 313,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "PC BACKLIT LED PANEL 20W CW/WW/NW, RD/SQ",
    sku: "PRD031",
    mrp: 1350,
    unitPrice: 469,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "LED Deep Draw PC Frame 2 X 2 Panel 36W CW/WW/NW - NEW",
    sku: "PRD032",
    mrp: 3000,
    unitPrice: 1175,
    caseLot: 4
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "LED DEEP DRAW 2 X 2 PANEL 36W CW/WW/NW",
    sku: "PRD033",
    mrp: 3450,
    unitPrice: 1175,
    caseLot: 2
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "LED DEEP DRAW 2 X 2 PANEL 36W CW/WW/NW (with clamp)",
    sku: "PRD034",
    mrp: 3450,
    unitPrice: 1308,
    caseLot: 4
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 3W CW/WW/NW/RE/GN/BL/PN/AM",
    sku: "PRD035",
    mrp: 190,
    unitPrice: 72,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 3W 3 in 1 CCT / RBP",
    sku: "PRD036",
    mrp: 260,
    unitPrice: 83,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 6W CW/WW/NW/RE/GN/BL/PN/AM",
    sku: "PRD037",
    mrp: 275,
    unitPrice: 91,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 6W 3 in 1 CCT / RBP",
    sku: "PRD038",
    mrp: 375,
    unitPrice: 111,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 9W CW/WW/NW/RE/GN/BL/PN/AM",
    sku: "PRD039",
    mrp: 390,
    unitPrice: 109,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 10W (4 INCH) CW/WW/NW - NEW",
    sku: "PRD040",
    mrp: 425,
    unitPrice: 136,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 12W (4 inch) CW/WW/NW",
    sku: "PRD041",
    mrp: 425,
    unitPrice: 180,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM GLO LED JB DOWNLIGHT 12W (3 INCH) CW/WW/NW",
    sku: "PRD042",
    mrp: 415,
    unitPrice: 147,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "HAZE PLUS LED PANEL 6W RD/SQ - NEW",
    sku: "PRD043",
    mrp: 500,
    unitPrice: 142,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "HAZE PLUS LED PANEL 10W RD/SQ - NEW",
    sku: "PRD044",
    mrp: 600,
    unitPrice: 180,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "HAZE PLUS LED PANEL 12W RD/SQ - NEW",
    sku: "PRD045",
    mrp: 800,
    unitPrice: 251,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "HAZE PLUS LED PANEL 15W RD/SQ - NEW",
    sku: "PRD046",
    mrp: 1000,
    unitPrice: 297,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "HAZE PLUS LED PANEL 20W RD/SQ - NEW",
    sku: "PRD047",
    mrp: 1350,
    unitPrice: 446,
    caseLot: 10
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "6W DUAL COLOR LED JB DOWNLIGHT CW+RGB/CW+WW/CW+BL/CW+PN",
    sku: "PRD048",
    mrp: 395,
    unitPrice: 216,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "12W DUAL COLOR LED JB DOWNLIGHT CW+RGB/CW+WW/CW+BL/CW+PN",
    sku: "PRD049",
    mrp: 695,
    unitPrice: 329,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "TWIRA TWIN COLOR LED JB DOWNLIGHT 10W 3 IN 1 / CW+RGB / BL+CW / GN+CW / PN+CW / WW+CW - NEW",
    sku: "PRD050",
    mrp: 695,
    unitPrice: 312,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "6W+6W DUAL COLOR LED PANEL CW + PGB/BL/GN/PN - NEW",
    sku: "PRD051",
    mrp: 595,
    unitPrice: 245,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SURFACE RING 6W+6W DUAL COLOR PANEL - NEW",
    sku: "PRD052",
    mrp: 195,
    unitPrice: 55,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "8W+8W DUAL COLOR LED ADJUSTABLE PANEL CW+RGB/CW+AM/CW+BL/CW+PN/CW+GR",
    sku: "PRD053",
    mrp: 895,
    unitPrice: 368,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "12W+12W DUAL COLOR LED ADJUSTABLE PANEL CW+RGB/CW+AM/CW+BL/CW+PN/CW+GR",
    sku: "PRD054",
    mrp: 1295,
    unitPrice: 595,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM RECESS PANEL (PC) 5W CW/WW/NW-RD/SQ",
    sku: "PRD055",
    mrp: 425,
    unitPrice: 139,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM RECESS PANEL (PC) 10W CW/WW/NW-RD/SQ",
    sku: "PRD056",
    mrp: 625,
    unitPrice: 167,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM RECESS PANEL (PC) 15W CW/WW/NW-RD/SQ",
    sku: "PRD057",
    mrp: 825,
    unitPrice: 284,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "SLIM RECESS PANEL (PC) 20W CW/WW/NW-RD/SQ",
    sku: "PRD058",
    mrp: 1225,
    unitPrice: 411,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "DEEP INTEGRAL NXT-G LED DOWNLIGHT 7W CW/WW/NW/BL/RE/GN/PN - NEW",
    sku: "PRD059",
    mrp: 350,
    unitPrice: 143,
    caseLot: 50
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "DEEP INTEGRAL NXT-G LED DOWNLIGHT 12W CW/WW/NW - NEW",
    sku: "PRD060",
    mrp: 650,
    unitPrice: 286,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "DEEP INTEGRAL NXT-G LED DOWNLIGHT 15W CW/WW/NW - NEW",
    sku: "PRD061",
    mrp: 750,
    unitPrice: 307,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "DEEP LED DOWNLIGHT 10W CW/WW/NW",
    sku: "PRD062",
    mrp: 695,
    unitPrice: 295,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "DEEP LED DOWNLIGHT 20W CW/WW/NW",
    sku: "PRD063",
    mrp: 1095,
    unitPrice: 505,
    caseLot: 10
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "3-IN-1 DEEP LED DOWNLIGHT 10W",
    sku: "PRD064",
    mrp: 795,
    unitPrice: 374,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "3-IN-1 DEEP LED DOWNLIGHT 20W",
    sku: "PRD065",
    mrp: 1195,
    unitPrice: 539,
    caseLot: 10
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "LED ACRYLIC DOWNLIGHT 3W RD 3 IN 1",
    sku: "PRD066",
    mrp: 275,
    unitPrice: 135,
    caseLot: 40
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "LED ACRYLIC DOWNLIGHT 7W RD 3 IN 1",
    sku: "PRD067",
    mrp: 325,
    unitPrice: 177,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZOUP LED SPOT DOWNLIGHT 7W (WHITE HSG & GOLD/GM REFLTR) CW/WW/NW - NEW",
    sku: "PRD068",
    mrp: 750,
    unitPrice: 320,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZOUP LED SPOT DOWNLIGHT 12W (WHITE HSG & GOLD/GM REFLTR) CW/WW/NW - NEW",
    sku: "PRD069",
    mrp: 1050,
    unitPrice: 481,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "ZOUP LED SPOT DOWNLIGHT 18W (WHITE HSG & GOLD/GM REFLTR) CW/WW/NW - NEW",
    sku: "PRD070",
    mrp: 1400,
    unitPrice: 641,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (RECESSED)",
    name: "LED STRIKER 3W CW/WW/RE/GN/BL/PN",
    sku: "PRD071",
    mrp: 200,
    unitPrice: 86,
    caseLot: 100
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "LED STRIKER 6W CW/WW/RE/GN/BL/PN",
    sku: "PRD072",
    mrp: 300,
    unitPrice: 150,
    caseLot: 100
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "LED STRIKER CURVE 5W CW/WW/RE/GN/BL/PN - NEW",
    sku: "PRD073",
    mrp: 300,
    unitPrice: 121,
    caseLot: 100
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "TWIST & FIT LED SURFACE LIGHT 7W RD CW/WW/NW - NEW",
    sku: "PRD074",
    mrp: 650,
    unitPrice: 288,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "TWIST & FIT LED SURFACE LIGHT 12W RD CW/WW/NW - NEW",
    sku: "PRD075",
    mrp: 975,
    unitPrice: 432,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "TWIST & FIT LED SURFACE LIGHT 20W RD CW/WW/NW - NEW",
    sku: "PRD076",
    mrp: 1200,
    unitPrice: 543,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "FRAMELESS LED PANEL 6W CW/WW/NW, RD/SQ",
    sku: "PRD077",
    mrp: 550,
    unitPrice: 202,
    caseLot: 30
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "FRAMELESS LED PANEL 12W CW/WW/NW, RD/SQ",
    sku: "PRD078",
    mrp: 800,
    unitPrice: 288,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "FRAMELESS LED PANEL 15W CW/WW/NW, RD/SQ",
    sku: "PRD079",
    mrp: 1000,
    unitPrice: 370,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "3-IN-1 FRAMELESS LED PANEL 15W, RD/SQ",
    sku: "PRD080",
    mrp: 1100,
    unitPrice: 462,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "FRAMELESS LED PANEL 18W CW/WW/NW, RD/SQ",
    sku: "PRD081",
    mrp: 1250,
    unitPrice: 412,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "FRAMELESS LED PANEL 24W CW/WW/NW, RD/SQ",
    sku: "PRD082",
    mrp: 1500,
    unitPrice: 626,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "SLIM SURFACE LED PANEL 6W CW/WW/NW, RD/SQ",
    sku: "PRD083",
    mrp: 650,
    unitPrice: 354,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "SLIM SURFACE LED PANEL 12W CW/WW/NW, RD/SQ",
    sku: "PRD084",
    mrp: 900,
    unitPrice: 496,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "SLIM SURFACE LED PANEL 15W CW/WW/NW, RD/SQ",
    sku: "PRD085",
    mrp: 1200,
    unitPrice: 547,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "SLIM SURFACE LED PANEL 18W CW/WW/NW, RD/SQ",
    sku: "PRD086",
    mrp: 1450,
    unitPrice: 741,
    caseLot: 20
  },
  {
    category: "PANELS & DOWNLIGHTS (SURFACE)",
    name: "SLIM SURFACE LED PANEL 22W CW/WW/NW, RD/SQ",
    sku: "PRD087",
    mrp: 1650,
    unitPrice: 837,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL LED SPOT 1W (WHITE) CW/WW/NW/RE/GR/BL/PN - NEW",
    sku: "PRD088",
    mrp: 150,
    unitPrice: 66,
    caseLot: 50
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL DECO LED SPOT 1W 3000K (ROSE GOLD) - NEW",
    sku: "PRD089",
    mrp: 180,
    unitPrice: 120,
    caseLot: 40
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL LED NXT-G SPOT LED LIGHT 2W CW/WW/RE/GN/BL/PN",
    sku: "PRD090",
    mrp: 150,
    unitPrice: 67,
    caseLot: 50
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 3W CW/WW/NW",
    sku: "PRD091",
    mrp: 390,
    unitPrice: 147,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 6W CW/WW/NW",
    sku: "PRD092",
    mrp: 490,
    unitPrice: 194,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 6W 3 IN 1",
    sku: "PRD093",
    mrp: 650,
    unitPrice: 217,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 9W CW/WW/NW",
    sku: "PRD094",
    mrp: 690,
    unitPrice: 266,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 9W 3 IN 1",
    sku: "PRD095",
    mrp: 725,
    unitPrice: 292,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 12W CW/WW/NW",
    sku: "PRD096",
    mrp: 890,
    unitPrice: 327,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "PEARL SWIVEL NXT-G SPOT LIGHT 12W 3 IN 1",
    sku: "PRD097",
    mrp: 850,
    unitPrice: 361,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "TILTABLE JB COB DOWNLIGHT 3W CW/WW/NW/BL/PN",
    sku: "PRD098",
    mrp: 295,
    unitPrice: 120,
    caseLot: 50
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "TILTABLE JB COB DOWNLIGHT 3W 3-IN-1",
    sku: "PRD099",
    mrp: 395,
    unitPrice: 154,
    caseLot: 50
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "TILTABLE JB COB DOWNLIGHT 3W RBP",
    sku: "PRD100",
    mrp: 395,
    unitPrice: 154,
    caseLot: 50
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "DELLA LED SPOT DOWNLIGHT 7W WHITE/BLACK HSG -RG/GM/SHINY/MATT WHITE/RG REFLTR CW/WW/NW - NEW",
    sku: "PRD101",
    mrp: 475,
    unitPrice: 220,
    caseLot: 20
  },
  {
    category: "COBS AND SPOTS (RECESSED)",
    name: "DELLA LED COB SPOT DOWNLIGHT 7W WHITE HSG CW/WW/NW - NEW",
    sku: "PRD102",
    mrp: 495,
    unitPrice: 200,
    caseLot: 20
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER LED FLOOD LIGHT 30W CW/WW/NW",
    sku: "PRD103",
    mrp: 1650,
    unitPrice: 1023,
    caseLot: 8
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER LED FLOOD LIGHT 50W CW/WW/NW",
    sku: "PRD104",
    mrp: 2150,
    unitPrice: 1170,
    caseLot: 8
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER LED FLOOD LIGHT 100W CW/WW/NW",
    sku: "PRD105",
    mrp: 3850,
    unitPrice: 2030,
    caseLot: 4
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER NEO LED FLOOD LIGHT 30W CW/WW/NW",
    sku: "PRD106",
    mrp: 1600,
    unitPrice: 795,
    caseLot: 20
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER NEO LED FLOOD LIGHT 50W CW/WW/NW",
    sku: "PRD107",
    mrp: 2100,
    unitPrice: 1061,
    caseLot: 10
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER NEO LED FLOOD LIGHT 100W CW/WW/NW - NEW",
    sku: "PRD108",
    mrp: 3800,
    unitPrice: 1441,
    caseLot: 8
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER NEO PLUS LED FLOOD LIGHT 150W CW/WW/NW - NEW",
    sku: "PRD109",
    mrp: 5100,
    unitPrice: 2089,
    caseLot: 5
  },
  {
    category: "FLOOD LIGHTS",
    name: "GLEER NEO PLUS LED FLOOD LIGHT 200W CW/WW/NW - NEW",
    sku: "PRD110",
    mrp: 6400,
    unitPrice: 2813,
    caseLot: 5
  },
  {
    category: "GATE LIGHTS",
    name: "VIGARO 20W LED GATE LIGHT IP65 CW/WW/NW (CLEAR)",
    sku: "PRD111",
    mrp: 2495,
    unitPrice: 1134,
    caseLot: 4
  },
  {
    category: "GATE LIGHTS",
    name: "VIGARO 20W LED GATE LIGHT IP65 (CLEAR) WITH POLE BASE CW/WW - NEW",
    sku: "PRD112",
    mrp: 2495,
    unitPrice: 1134,
    caseLot: 4
  },
  {
    category: "GATE LIGHTS",
    name: "VIGARO 24W LED GATE LIGHT IP65 CW/WW/NW (OPAL)",
    sku: "PRD113",
    mrp: 1995,
    unitPrice: 992,
    caseLot: 4
  },
  {
    category: "GATE LIGHTS",
    name: "VIGARO GATE LIGHT FIXTURE (WITHOUT BULB)",
    sku: "PRD114",
    mrp: 1299,
    unitPrice: 732,
    caseLot: 4
  },
  {
    category: "GATE LIGHTS",
    name: "VIGARO 24W TWIN COLOR GATE LIGHT IP65 WW+BL/ CW+BL (CLEAR) - NEW",
    sku: "PRD115",
    mrp: 3000,
    unitPrice: 1495,
    caseLot: 4
  },
  {
    category: "STREET LIGHTS",
    name: "AGLOW LED STREET LIGHT 24W CW/WW/NW",
    sku: "PRD116",
    mrp: 1495,
    unitPrice: 681,
    caseLot: 12
  },
  {
    category: "STREET LIGHTS",
    name: "AGLOW LED STREET LIGHT 36W CW/WW/NW",
    sku: "PRD117",
    mrp: 1995,
    unitPrice: 903,
    caseLot: 8
  },
  {
    category: "STREET LIGHTS",
    name: "AGLOW LED STREET LIGHT 50W CW/WW/NW",
    sku: "PRD118",
    mrp: 2595,
    unitPrice: 1238,
    caseLot: 4
  },
  {
    category: "STREET LIGHTS",
    name: "EMBLAZE LED STREET LIGHT 24W CW/WW/NW",
    sku: "PRD119",
    mrp: 1495,
    unitPrice: 681,
    caseLot: 12
  },
  {
    category: "STREET LIGHTS",
    name: "EMBLAZE LED STREET LIGHT 36W CW/WW/NW",
    sku: "PRD120",
    mrp: 1995,
    unitPrice: 903,
    caseLot: 8
  },
  {
    category: "STREET LIGHTS",
    name: "EMBLAZE LED STREET LIGHT 50W CW/WW/NW",
    sku: "PRD121",
    mrp: 2595,
    unitPrice: 1238,
    caseLot: 4
  },
  {
    category: "BULKHEAD LIGHTS",
    name: "BULKHEAD 10W IP54 CW/WW/NW",
    sku: "PRD122",
    mrp: 450,
    unitPrice: 229,
    caseLot: 20
  },
  {
    category: "BULKHEAD LIGHTS",
    name: "BULKHEAD 20W IP54 CW/WW/NW",
    sku: "PRD123",
    mrp: 795,
    unitPrice: 283,
    caseLot: 20
  },
  {
    category: "BULKHEAD LIGHTS",
    name: "BULKHEAD 10W IP65 CW/WW/NW",
    sku: "PRD124",
    mrp: 450,
    unitPrice: 237,
    caseLot: 20
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "2835 LED ROPE LIGHT 20MTR IP65 120-LED CW/WW/NW/RE/GN/BL/PN/IB/AM",
    sku: "PRD125",
    mrp: 4500,
    unitPrice: 1717,
    caseLot: 4
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "2835 LED ROPE LIGHT 45MTR IP65 120-LED CW/WW/NW/RE/GN/BL/PN/IB/AM",
    sku: "PRD126",
    mrp: 9995,
    unitPrice: 3576,
    caseLot: 1
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "LED ROPE LIGHT RECTIFIER 220V-240V 1.8A IP 65",
    sku: "PRD127",
    mrp: 270,
    unitPrice: 156,
    caseLot: 20
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "2835 LED STRIP LIGHT 12V IP20 60-LED CW/WW/NW/RE/GN/BL",
    sku: "PRD128",
    mrp: 700,
    unitPrice: 318,
    caseLot: 10
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "2835 LED STRIP LIGHT 12V IP20 120-LED CW/WW/RE/GN/BL/PN",
    sku: "PRD129",
    mrp: 1680,
    unitPrice: 464,
    caseLot: 10
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "2835 LED STRIP LIGHT 12V IP20 240-LED CW/WW/NW",
    sku: "PRD130",
    mrp: 1900,
    unitPrice: 699,
    caseLot: 40
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "ZURO COB STRIP LIGHT 24V IP20 320-LED CW/WW/NW/RE/GN/BL/PN/IB/AM",
    sku: "PRD131",
    mrp: 1995,
    unitPrice: 699,
    caseLot: 5
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "LED DRIVER FOR STRIP LIGHT 12V - 2A",
    sku: "PRD132",
    mrp: 470,
    unitPrice: 240,
    caseLot: 10
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS FOR LED STRIP LIGHT 12V - 5A",
    sku: "PRD133",
    mrp: 595,
    unitPrice: 407,
    caseLot: 50
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS FOR LED STRIP LIGHT 12V - 10A",
    sku: "PRD134",
    mrp: 995,
    unitPrice: 543,
    caseLot: 20
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS FOR LED STRIP LIGHT 24V - 3A",
    sku: "PRD135",
    mrp: 1295,
    unitPrice: 598,
    caseLot: 20
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS for LED STRIP LIGHT 12V - 12.5A - NEW",
    sku: "PRD136",
    mrp: 1870,
    unitPrice: 878,
    caseLot: 20
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS for LED STRIP LIGHT 12V - 16.5A - NEW",
    sku: "PRD137",
    mrp: 2340,
    unitPrice: 983,
    caseLot: 20
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS for LED STRIP LIGHT 12V - 25A - NEW",
    sku: "PRD138",
    mrp: 2570,
    unitPrice: 1188,
    caseLot: 10
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "SMPS for LED STRIP LIGHT 12V - 33.5A - NEW",
    sku: "PRD139",
    mrp: 3265,
    unitPrice: 1433,
    caseLot: 10
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "TINY STAR LED STRING LIGHT 10Mtr 48LEDS WW/AMBER/GREEN/RED/BLUE/PINK",
    sku: "PRD140",
    mrp: 349,
    unitPrice: 184,
    caseLot: 30
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "TINY STAR LED STRING LIGHT 10Mtr 48LEDS RGRB",
    sku: "PRD141",
    mrp: 399,
    unitPrice: 230,
    caseLot: 30
  },
  {
    category: "ROPE & STRIP LIGHTS",
    name: "TINY STAR LED STRING LIGHT 13Mtr 72LEDS WW/AMBER/GREEN/RED/BLUE/PINK",
    sku: "PRD142",
    mrp: 399,
    unitPrice: 230,
    caseLot: 30
  },
  {
    category: "BATTENS",
    name: "NEO+ SLIM LED BATTEN 8W (1 FEET) CW/WW/NW",
    sku: "PRD143",
    mrp: 260,
    unitPrice: 116,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "NEO+ SLIM LED BATTEN 12W (2 FEET) CW/WW/NW",
    sku: "PRD144",
    mrp: 290,
    unitPrice: 121,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "NEO+ SLIM LED BATTEN 20W (4 FEET) CW/WW/NW",
    sku: "PRD145",
    mrp: 320,
    unitPrice: 95,
    caseLot: 30
  },
  {
    category: "BATTENS",
    name: "NEO SLIM LED BATTEN 20W (2 FEET) CW/WW/NW",
    sku: "PRD146",
    mrp: 250,
    unitPrice: 142,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "INTENSO NEO + SLIM LED BATTEN 20W CW/WW/NW",
    sku: "PRD147",
    mrp: 320,
    unitPrice: 95,
    caseLot: 30
  },
  {
    category: "BATTENS",
    name: "INTENSO NEO+ SLIM LED BATTEN 22W CW - NEW",
    sku: "PRD148",
    mrp: 450,
    unitPrice: 105,
    caseLot: 40
  },
  {
    category: "BATTENS",
    name: "INTENSO LED BATTEN SQ PC 24W (1100x32MM) CW/WW/NW",
    sku: "PRD149",
    mrp: 750,
    unitPrice: 166,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "LED BATTEN PC 24W CW/WW",
    sku: "PRD150",
    mrp: 750,
    unitPrice: 185,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "LED BATTEN PC 30W CW",
    sku: "PRD151",
    mrp: 725,
    unitPrice: 294,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "INTENSO LED BATTEN 36W (4 FEET) CW/WW/NW - NEW",
    sku: "PRD152",
    mrp: 1045,
    unitPrice: 309,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "LED BATTEN 1180MM AL 40W CW",
    sku: "PRD153",
    mrp: 960,
    unitPrice: 409,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "INTENSO HEXAGON LED BATTEN (PC) 45W CW - NEW",
    sku: "PRD154",
    mrp: 1450,
    unitPrice: 442,
    caseLot: 20
  },
  {
    category: "BATTENS",
    name: "INTENSO LED BATTEN ( PC) 50W CW - NEW",
    sku: "PRD155",
    mrp: 1500,
    unitPrice: 495,
    caseLot: 20
  },
  {
    category: "EMERGENCY BULBS",
    name: "LED EMERGENCY BULB 9W CW A70",
    sku: "PRD156",
    mrp: 545,
    unitPrice: 241,
    caseLot: 30
  },
  {
    category: "EMERGENCY BULBS",
    name: "NXT-G LED EMERGENCY BULB 10W CW",
    sku: "PRD157",
    mrp: 525,
    unitPrice: 241,
    caseLot: 30
  },
  {
    category: "EMERGENCY BULBS",
    name: "LED EMERGENCY DIMMABLE BULB 12W CW",
    sku: "PRD158",
    mrp: 645,
    unitPrice: 275,
    caseLot: 20
  },
  {
    category: "EMERGENCY BULBS",
    name: "NXT-G LED EMERGENCY BULB 15W CW - NEW",
    sku: "PRD159",
    mrp: 995,
    unitPrice: 379,
    caseLot: 20
  },
  {
    category: "EMERGENCY BULBS",
    name: "NXT-G LED EMERGENCY BULB 18W CW - NEW",
    sku: "PRD160",
    mrp: 1195,
    unitPrice: 514,
    caseLot: 20
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 15W BC CW/WW",
    sku: "PRD161",
    mrp: 350,
    unitPrice: 96,
    caseLot: 20
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 18W BC CW/WW",
    sku: "PRD162",
    mrp: 425,
    unitPrice: 103,
    caseLot: 20
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 20W BC CW/WW",
    sku: "PRD163",
    mrp: 500,
    unitPrice: 201,
    caseLot: 20
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 23W BC CW/WW",
    sku: "PRD164",
    mrp: 600,
    unitPrice: 244,
    caseLot: 20
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 30W BC CW/WW",
    sku: "PRD165",
    mrp: 750,
    unitPrice: 250,
    caseLot: 10
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 40W BC CW/WW",
    sku: "PRD166",
    mrp: 900,
    unitPrice: 353,
    caseLot: 10
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 50W BC CW/WW",
    sku: "PRD167",
    mrp: 1050,
    unitPrice: 451,
    caseLot: 10
  },
  {
    category: "HIGH WATTAGE BULBS",
    name: "NXT-G LED T-LAMP 60W BC CW",
    sku: "PRD168",
    mrp: 1200,
    unitPrice: 543,
    caseLot: 6
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 3W BC CW/WW",
    sku: "PRD169",
    mrp: 120,
    unitPrice: 42,
    caseLot: 10
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 5W BC CW/WW",
    sku: "PRD170",
    mrp: 130,
    unitPrice: 42,
    caseLot: 10
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 7W BC CW/WW",
    sku: "PRD171",
    mrp: 140,
    unitPrice: 42,
    caseLot: 100
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 9W BC CW/WW",
    sku: "PRD172",
    mrp: 150,
    unitPrice: 40,
    caseLot: 100
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 9W B22 3 IN 1",
    sku: "PRD173",
    mrp: 299,
    unitPrice: 104,
    caseLot: 30
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "LED BULB 9W B22(WD) CW",
    sku: "PRD174",
    mrp: 160,
    unitPrice: 70,
    caseLot: 50
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 12W B22 (SH) CW/WW",
    sku: "PRD175",
    mrp: 265,
    unitPrice: 69,
    caseLot: 100
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 12W BC CW/WW",
    sku: "PRD176",
    mrp: 275,
    unitPrice: 89,
    caseLot: 50
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 15W B22 CW/ WW",
    sku: "PRD177",
    mrp: 300,
    unitPrice: 103,
    caseLot: 50
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 18W B22 CW",
    sku: "PRD178",
    mrp: 400,
    unitPrice: 169,
    caseLot: 20
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED BULB 23W B22 CW",
    sku: "PRD179",
    mrp: 500,
    unitPrice: 223,
    caseLot: 20
  },
  {
    category: "BULBS (LOW & MEDIUM WATTAGE)",
    name: "NXT-G LED CANDLE BULB 4.5W E14/E27 WW",
    sku: "PRD180",
    mrp: 195,
    unitPrice: 65,
    caseLot: 50
  },
  {
    category: "DECO & PLUG IN",
    name: "LED DECO LAMP 0.5W CW/WW/RE/YW/BL/GN/PN/OG",
    sku: "PRD181",
    mrp: 50,
    unitPrice: 27,
    caseLot: 48
  },
  {
    category: "DECO & PLUG IN",
    name: "LED DECO LAMP 0.5W MULTI-COLOUR CCT",
    sku: "PRD182",
    mrp: 99,
    unitPrice: 41,
    caseLot: 50
  },
  {
    category: "DECO & PLUG IN",
    name: "LED PLUG-IN LAMP 0.5W CW/WW/RE/YW/BL/GN/PN/OG",
    sku: "PRD183",
    mrp: 120,
    unitPrice: 50,
    caseLot: 48
  },
  {
    category: "DECO & PLUG IN",
    name: "TINY GLO LED PLUG-IN LAMP 0.5W CW/WW/RE/GN/BL/PN/AM/PP/IB",
    sku: "PRD184",
    mrp: 120,
    unitPrice: 71,
    caseLot: 48
  }
]

export function getCatalogProducts(): Product[] {
  return CATALOG_ENTRIES.map((entry, index) => ({
    id: `prod_${String(index + 1).padStart(4, '0')}`,
    ...entry,
  }))
}

export const PRODUCT_CATALOG_COUNT = CATALOG_ENTRIES.length
