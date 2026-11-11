# Adminübersicht – Update

## Lokal ansehen

1. Laufende Vorschau mit Strg+C beenden.
2. Im Projektordner einen Entwicklungsbranch anlegen: git switch -c admin-uebersicht
3. Die Ordner client, server, shared, tests sowie vite.preview.config.ts aus diesem Paket in den Ordner mit package.json kopieren. Ordner zusammenführen und gleichnamige Dateien ersetzen.
4. Starten: node node_modules/vite/bin/vite.js --config vite.preview.config.ts
5. Die Local-Adresse aus dem Terminal öffnen und /admin anhängen.

Im lokalen Vorschaumodus wird die Verwaltung mit fiktiven Beispielkontakten und Zahlen ohne Anmeldung angezeigt. Alle Schreibvorgänge sind gesperrt; es gibt keinen Zugriff auf die Datenbank und keinen E-Mail-Versand. Zum Designprüfen sind keine echten Zugangsdaten nötig.

## Enthalten

- Übersicht mit aktuell gespeicherten, veröffentlichten und unbestätigten Anzeigen.
- Unterschiedliche bestätigte Ersteller-E-Mail-Adressen mit vorhandenen veröffentlichten Anzeigen.
- Veröffentlichungen und weitergeleitete bestätigte Kontaktanfragen der letzten 30 Berliner Kalendertage.
- Verteilung vorhandener veröffentlichter Anzeigen nach Kategorie und Stadt.
- Durchsuchbare, seitenweise Anzeigenverwaltung mit privaten E-Mail-Adressen und Bestätigungsstatus.
- Kontakte: pro bestätigter Adresse ein Eintrag; Angaben stammen aus der neuesten vorhandenen Anzeige. Die Kontaktübersicht wird aus den Anzeigen abgeleitet, nicht als separate dauerhafte Marketingdatei gespeichert.
- Nach Löschung der letzten Anzeige verschwindet die Adresse aus der Kontaktübersicht.
- Bestätigte Vorgänge werden transaktional mit dem Verbrauch des Bestätigungslinks gezählt. Wiederholtes Bestätigen desselben Links zählt nicht doppelt.
- Tageszähler enthalten ausschließlich Datum und Anzahl, ohne Namen, Adressen, Nachrichteninhalt oder Anzeigen-ID.
- Admin-Endpunkte erfordern die bestehende Admin-Sitzung. Antworten werden nicht gecacht; Loginversuche sind begrenzt und erfolgreiche Anmeldung erneuert die Sitzung.
- Beim Abmelden oder erkannter abgelaufener Sitzung werden private Verwaltungsdaten aus dem Browser-Abfragecache entfernt. Kein CSV-Export und keine Speicherung dieser Daten im localStorage.

## Bedeutung der Zahlen

Ohne Accounts gibt es keine genaue Nutzerzahl. Unterschiedliche E-Mail-Adressen sind keine nachweislich unterschiedlichen Personen und erfassen keine reinen Besucher. Alters- und Namensangaben sind Selbstauskünfte.

Das Update ergänzt beim ersten Start zwei Tabellen (platform_daily und platform_metrics_meta), ohne bestehende Anzeigen zu löschen. Das Startdatum der Statistik wird gespeichert. Es gibt keine rückwirkende Schätzung alter Veröffentlichungen oder Kontaktanfragen. Ein Tageswert zählt eine erstmals bestätigte Veröffentlichung bzw. eine vom Versanddienst angenommene Weiterleitung, nicht einen tatsächlichen Postfacheingang oder ein Treffen.

Bereits gezählte Tageswerte bleiben nach Anzeigenlöschung erhalten. Aktuelle Bestandszahlen ändern sich dagegen mit den vorhandenen Anzeigen. Die Ansichten sind für den Betreiber; keine Weitergabe von Kontaktlisten an Werbepartner und keine Newsletter-Einwilligung durch Veröffentlichung einer Anzeige.

Für die zusätzliche Statistik sind die Datenschutzhinweise zu prüfen und passend zu Zweck, Rechtsgrundlage und Aufbewahrung zu ergänzen. Dieses Update erzeugt keine Datenschutzerklärung. Es erstellt auch kein vollständiges Wiederherstellungs- oder Sicherungskonzept.

## Prüfung

npm run check
npm test
npm run build

Ausgeführt: TypeScript-Prüfung, Produktions-Build und Integrationstests gegen separate PGlite-Datenbank mit simuliertem Mailversand. Die Tests prüfen auch unauthentifizierte Adminzugriffe, private Feldprojektion ohne Verwaltungsschlüssel, Zusammenfassung gleicher Adressen, Suchparameter, Kontaktlöschung und fortbestehende Tageszählungen nach Löschung. Es wurde keine echte Nutzer-Datenbank abgefragt und keine echte E-Mail versendet.

In der Entwicklungsumgebung wurde der Produktions-Build mit node --import tsx script/build.ts ausgeführt (dasselbe Buildskript, ohne den hier blockierten IPC-Socket des tsx-CLI).

## Veröffentlichung nach visueller Prüfung

Die geänderten Dateien gezielt mit git add vormerken; niemals node_modules oder .env hochladen. Änderungen zunächst auf dem Branch admin-uebersicht committen und pushen, danach über einen Pull Request prüfen und nach main übernehmen.

Render behält dieselben Umgebungsvariablen: DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, RESEND_API_KEY, EMAIL_FROM und APP_BASE_URL. Kein neuer Schlüssel erforderlich. Nach dem Deploy /admin auf der offiziellen Domain aufrufen, anmelden, Bestandsdaten prüfen und mit einer eigenen Testanzeige sowie einer eigenen Kontaktanfrage die neuen Zähler prüfen.
