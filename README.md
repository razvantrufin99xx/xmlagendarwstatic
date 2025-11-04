Contacts Agenda (XML) — Static web app

This is a small phone-friendly contacts agenda that stores data as XML in the browser's localStorage. It supports:

- Fields: name, address, email, phone, picture (base64), birthdate, sex
- Add / Edit / Delete contacts
- Import and Export XML files
- Local persistence via localStorage

How to use

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox). For full features (file import), serve the folder via a local server (optional):

   # PowerShell example (in project folder)
   python -m http.server 8000

2. Click Add to create a contact. Use the picture control to upload an image; images are stored as data URLs inside the XML (in localStorage).
3. Export to download the XML. Import to load an XML file.

Notes & next steps

- The app stores the XML in localStorage key `agenda_xml_v1`.
- If you prefer a server-based approach (PHP + Ajax), I can add a simple PHP backend that reads/writes an `contacts.xml` file on disk; tell me if you'd like that.
- To reset the data, clear localStorage for the page in developer tools or remove the `agenda_xml_v1` key.

