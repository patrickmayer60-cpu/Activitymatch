# Kategorien und Deutsch/Englisch

## Lokal prüfen

1. Vorschau im Terminal durch gleichzeitiges Drücken von Strg und C beenden.
2. Die Ordner client, server, shared und tests sowie package.json und vite.preview.config.ts aus dem Paket in den Projektordner mit package.json kopieren. Gleichnamige Dateien ersetzen, Ordner zusammenführen.
3. Keine neuen Abhängigkeiten: keine zusätzliche Installation notwendig.
4. Vorschau starten: node node_modules/vite/bin/vite.js --config vite.preview.config.ts
5. Local-Adresse öffnen. Oben ist die Auswahl Deutsch / English.
6. Filter öffnen, Kategorie wählen und Beispielanzeigen prüfen.
7. /create ansehen und während des Ausfüllens Sprache wechseln: Eingaben bleiben bestehen.
8. /admin aufrufen: Kategorien erscheinen einzeln in der Demo-Statistik.

Die lokale Vorschau bleibt ohne Datenbank und E-Mail-Versand. Die sechs Beispielanzeigen sind jetzt Rennrad, Laufen, Wandern, Tennis, Schwimmen und Gravelbike zugeordnet. Ihre Beschreibungen bleiben absichtlich deutsch: Das Update übersetzt die Benutzeroberfläche, nicht fremde Anzeigeninhalte.

## Kategorien

30 gemeinsame Werte für Formular, Filter, Bearbeitung und Statistik:
Laufen, Rennrad, Gravelbike, Mountainbike, Radfahren, Inlineskaten, Skateboard, Schwimmen, Triathlon, Wandern, Spazierengehen, Fitness, Krafttraining, Yoga, Pilates, Tennis, Padel, Badminton, Fußball, Volleyball, Basketball, Klettern, Bouldern, Wintersport, Wassersport, Outdoor, Gaming, Musik, Kunst, Sonstiges.

Die gespeicherten Werte bleiben unabhängig von der Oberflächensprache gleich. Beispielsweise zeigt die englische Oberfläche Running an, verwendet intern aber den Wert Laufen. Dadurch zerfallen die Statistik und die Filter nicht in deutsche und englische Dubletten.

Bestehende Anzeigen behalten ihre bisherige Kategorie; es erfolgt keine automatische Umklassifizierung aus Titel oder Beschreibung. Ihre Ersteller können über den privaten Verwaltungslink die Kategorie anpassen. Der vorhandene Adminbereich zeigt den aktuellen Anzeigenbestand nach den feineren Kategorien; historische Tageszählungen bleiben Gesamtzahlen.

## Sprache

- Oben auf jeder Seite Deutsch / English umschaltbar.
- Sprachwahl wird lokal als reine Spracheinstellung im Browser gespeichert; keine externe Übersetzungs-API.
- Oberflächenlabels, Kategorien, Formulare, Adminübersicht, Datumsformate und die wesentlichen Systemmeldungen werden übersetzt.
- Freie Anzeigentitel, Beschreibungen, Kontakthinweise, Nachrichten und Ortsnamen werden nicht automatisch übersetzt.
- Neue Anzeigen speichern die beim Absenden gewählte Sprache für System-E-Mails. Alte Anzeigen verwenden Deutsch.
- Bestätigungs-E-Mail für Kontaktanfragen verwendet die Sprache des Absenders. Weitergeleitete Anfrage verwendet die gespeicherte Sprache des Anzeigen-Erstellers.
- Bestätigungs- und Verwaltungslinks enthalten einen unkritischen Sprachparameter; private Tokens bleiben im URL-Fragment.
- Die Datenbank erhält automatisch eine zusätzliche Spalte language mit Standardwert de. Keine bestehenden Anzeigen werden gelöscht.
- ADMIN_PASSWORD, SESSION_SECRET, DATABASE_URL, RESEND_API_KEY, EMAIL_FROM und APP_BASE_URL bleiben unverändert.

## Prüfung

npm run check
npm test
npm run build

Ausgeführt: TypeScript, Produktions-Build, vorhandene Integrationstests sowie neue Sprach-/Kategorietests. Geprüft wurden alle 30 Kategorien, weiterhin akzeptierte alte Kategorien, kanonische Filterwerte, unveränderter Anzeigeninhalt, DE/EN-Labels und Datumsformate sowie deutsche und englische E-Mail-Templates. Zusätzlich wurde der englische Erstellen-/Bestätigen-/Kontakt-Ablauf mit separater Testdatenbank und simuliertem Maildienst durchgespielt; die neue Kategorie erscheint in der Admin-Statistik.

Startseite, Erstellformular und Adminübersicht wurden außerdem als HTML in Deutsch und Englisch gerendert und auf übersetzte Beschriftungen geprüft. Visuelle Prüfung und Bedienung im Browser erfolgen vor Veröffentlichung in der lokalen Vorschau.

Der Produktions-Build wurde hier über node --import tsx script/build.ts ausgeführt (dasselbe Buildskript, ohne den hier blockierten IPC-Socket der tsx-CLI).

## Nach lokaler Freigabe

Nur die Update-Dateien committen und nach GitHub übertragen; keine node_modules oder .env. Render veröffentlicht nach Übernahme nach main. Anschließend beide Sprachen und eine englische Testanzeige mit eigenen E-Mail-Adressen auf der echten Website prüfen.

Die allgemeine Kategorie Sport ist aus der Neuanlage und dem Filter entfernt. Eventuell noch vorhandene Altanzeigen bleiben bis zur Löschung oder manuellen Umklassifizierung erhalten; in ihrer Verwaltung wird die Alt-Kategorie als solche markiert. Es werden durch dieses Update keine Anzeigen gelöscht. Wassersport bleibt eine gemeinsame Kategorie ohne zusätzliche Surf-Unterteilung.
