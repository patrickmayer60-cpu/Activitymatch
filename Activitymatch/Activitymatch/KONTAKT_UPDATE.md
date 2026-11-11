# ActivityMatch: Kontakt ohne Account

## Enthalten

- Private E-Mail-Adresse statt öffentlicher E-Mail/Telefon-Verknüpfung.
- Neue Anzeigen werden erst nach Bestätigung veröffentlicht.
- Zwei Links in der E-Mail: Veröffentlichung und private Verwaltung.
- Verwaltung: Titel, Beschreibung, Stadt, Kategorie, Level, Datum und Uhrzeit bearbeiten; Kontaktanfragen pausieren; Anzeige löschen.
- Kontaktformular mit Zustimmung zur Weitergabe der Absenderadresse.
- Jede Kontaktanfrage wird erst nach E-Mail-Bestätigung weitergeleitet.
- Antwortadresse ist die Adresse des Interessenten; die Antwort erfolgt im persönlichen Postfach. Bei dieser Antwort wird auch die Adresse des Erstellers sichtbar.
- Bestätigung erfordert einen bewussten Klick auf der Website. Ein Linkabruf allein bewirkt nichts.
- Bestätigungslinks: Anzeige 24 Stunden, Kontaktanfrage 1 Stunde.
- Verwaltungsschlüssel liegen nur als Hash in der Datenbank. URL-Fragmente verhindern eine Übermittlung der Links in Server-URL-Logs.
- Persistente Begrenzungen gegen massenhafte Anfragen. Standardbudget: 90 Versandversuche pro UTC-Tag; optional MAIL_DAILY_LIMIT.
- Abgelaufene Anfragen und unbestätigte Anzeigen werden beim Start und stündlich bereinigt. Wenn Render schläft, erfolgt dies beim nächsten Start.

## Bestehende Anzeigen

Sie werden durch das Update nicht gelöscht und bleiben sichtbar. Ihre Kontaktadressen werden nicht mehr öffentlich ausgegeben. Da ihre Adressen bisher nicht bestätigt wurden, ist das Kontaktformular für diese Altanzeigen gesperrt. Falls sie weiter genutzt werden sollen, die Anzeige neu erstellen und per E-Mail bestätigen. Alte Löschschlüssel bleiben gültig.

## Render

Root Directory und bestehende Build-/Startbefehle beibehalten. Erwartet:

- Root Directory: der Ordner, der package.json enthält (hier Activitymatch/Activitymatch).
- Build: npm ci && npm run build (oder den bisherigen gleichwertigen Befehl beibehalten).
- Start: npm start.
- Vorhandenes DATABASE_URL beibehalten.
- RESEND_API_KEY, EMAIL_FROM, APP_BASE_URL wie besprochen hinterlegen.
- SESSION_SECRET für gleichbleibende Admin-Sitzungen setzen, falls nicht vorhanden. Ohne Wert wird pro Start ein zufälliger Schlüssel verwendet.
- Zugangsschlüssel niemals in GitHub eintragen.

Die neue Version ergänzt Datenbanktabellen und Spalten beim Start in einer Transaktion. Vorhandene Spalten werden nicht gelöscht. Der bisherige automatische, interaktive Aufruf von drizzle-kit push wurde dafür ersetzt. Die Datenbankrolle benötigt Berechtigungen zum Anlegen von Tabellen und Ergänzen von Spalten. Vor dem Produktivwechsel vorhandene Datenbank-Sicherungsmöglichkeiten nutzen.

## Prüfung

npm ci
npm run check
npm test
npm run build

Die automatisierten Tests verwenden eine separate lokale PostgreSQL-kompatible PGlite-Datenbank und einen simulierten Resend-Endpunkt. Es werden keine echten E-Mails versendet und keine Produktivdaten gelesen.

Geprüft: wiederholbare Migration, unsichtbare unbestätigte Anzeigen, öffentliche Daten ohne Kontaktadressen/Schlüssel, Bestätigung, doppelte Links, Reply-To, Zustimmung, Verwaltungsberechtigung, Bearbeitung, Kontaktsperre, abgelaufene Links, Limits, Versandfehler, Löschung und Bereinigung.

TypeScript-Prüfung und Produktions-Build wurden ausgeführt. Hier wurde das Buildskript mit node --import tsx script/build.ts gestartet, weil diese Ausführungsumgebung den IPC-Socket des tsx-CLI blockiert. Es ist dasselbe Buildskript wie npm run build.

Noch auf Render prüfen: echte E-Mail-Zustellung, vollständiger Browserablauf einschließlich Mobilansicht, aktuelle Produktionsdatenbank und Domain/HTTPS. Keine Verbindung zum echten Resend-Account war für die lokalen Tests erforderlich.

## Live-Test nach Veröffentlichung

1. Neue Anzeige mit eigener E-Mail-Adresse erstellen.
2. Prüfen, dass sie vor Bestätigung nicht öffentlich erscheint.
3. E-Mail öffnen; Veröffentlichungslink öffnen und auf Jetzt bestätigen klicken.
4. Privaten Verwaltungslink aufbewahren und Bearbeitung testen.
5. Mit einer zweiten eigenen E-Mail-Adresse eine Kontaktanfrage stellen.
6. Zweite Adresse bestätigen; erst dann muss die Anfrage beim Ersteller eintreffen.
7. Im Postfach auf Antworten klicken und die Zieladresse prüfen.
8. Kontaktanfragen in der Verwaltung deaktivieren und die Sperre prüfen.
9. Testanzeige über den Verwaltungslink löschen.

Die Resend-Annahme einer Nachricht ist keine Garantie der Postfachzustellung. Versandstatus/Spamordner bei Bedarf prüfen.

## Später: eigene Webdomain

Nachdem activitymatch.de bzw. www.activitymatch.de unter HTTPS geprüft wurde, APP_BASE_URL auf die gewünschte Hauptadresse ändern. Danach neue Bestätigungslinks und Verwaltungslinks testen. Die Versanddomain mail.activitymatch.de bleibt davon unabhängig.

Nicht Bestandteil dieses Updates: umfassende Neugestaltung der Startseite, öffentliches Supportpostfach, Nutzeraccounts oder ein eigener Chat. Alter und Geschlecht bleiben wie bisher Pflichtfelder; diese können in einer späteren Formularvereinfachung optional werden.
