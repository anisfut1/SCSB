/**
 * Auto-test minimal de sanitize.ts — pas de framework de test pour ce spike
 * isolé, juste des assertions exécutées via `npm run selftest`. Sert de
 * garde-fou : si ce fichier échoue, ne fais confiance à AUCUN rapport généré
 * par le probe tant qu'il n'est pas corrigé.
 */
import {
  assertReportIsClean,
  extractPostParamNames,
  findSuspiciousPatterns,
  isForbiddenHeaderName,
  redactUrlQueryValues,
} from "./sanitize.ts";

let failures = 0;

function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}`);
  }
}

console.log("isForbiddenHeaderName");
check("cookie est interdit", isForbiddenHeaderName("Cookie"));
check("authorization est interdit", isForbiddenHeaderName("Authorization"));
check("content-type n'est pas interdit", !isForbiddenHeaderName("Content-Type"));

console.log("redactUrlQueryValues");
check(
  "les valeurs de query params sont retirées",
  redactUrlQueryValues("https://extranet.ffbb.com/fbi/recherche.do?nom=Dupont&prenom=Jean") ===
    "https://extranet.ffbb.com/fbi/recherche.do?nom=%3Credacted%3E&prenom=%3Credacted%3E",
);
check(
  "une URL sans query reste inchangée (hors slash final)",
  redactUrlQueryValues("https://extranet.ffbb.com/fbi/accueil.fbi").startsWith(
    "https://extranet.ffbb.com/fbi/accueil.fbi",
  ),
);

console.log("extractPostParamNames");
check(
  "form-urlencoded : seuls les noms sont extraits",
  JSON.stringify(extractPostParamNames("nom=Dupont&prenom=Jean&saison=2025", "application/x-www-form-urlencoded")) ===
    JSON.stringify(["nom", "prenom", "saison"]),
);
check(
  "JSON : les clés imbriquées sont aplaties, jamais les valeurs",
  JSON.stringify(extractPostParamNames('{"filter":{"nom":"Dupont"}}', "application/json")) ===
    JSON.stringify(["filter.nom"]),
);
check(
  "aucun résultat pour un corps vide",
  extractPostParamNames(null, "application/json").length === 0,
);

console.log("findSuspiciousPatterns");
check("détecte un email", findSuspiciousPatterns("contact: jean.dupont@example.com").length > 0);
check("détecte un numéro long", findSuspiciousPatterns("licence 12345678").length > 0);
check("ne déclenche rien sur du texte structurel neutre", findSuspiciousPatterns("GET /fbi/accueil.fbi 200 text/html").length === 0);

console.log("assertReportIsClean");
try {
  assertReportIsClean({ routes: ["/fbi/accueil.fbi"], statuses: [200] });
  check("ne lève pas sur un rapport propre", true);
} catch {
  check("ne lève pas sur un rapport propre", false);
}

try {
  assertReportIsClean({ note: "contact jean.dupont@example.com" });
  check("lève bien sur un rapport contenant un email", false);
} catch {
  check("lève bien sur un rapport contenant un email", true);
}

console.log();
if (failures > 0) {
  console.error(`${failures} assertion(s) en échec — NE PAS FAIRE CONFIANCE à sanitize.ts en l'état.`);
  process.exit(1);
}
console.log("Toutes les assertions sont passées.");
