# Open points

Items that the sources (the WordPress export of 12 Nov 2026 and CV.tex) did not settle. Nothing below was guessed on the site: each item is either left out or flagged here.

## Needed from you

- [ ] **Profile photo.** None was provided. Put it in `src/assets/img/` (e.g. `portrait.jpg`, about 400 px wide) and set `"photo": "/assets/img/portrait.jpg"` in `src/_data/site.json`. It appears on the home page, in the JSON-LD and in link previews.
- [ ] **Custom domain.** Decide whether gianvincenzoalfano.net moves to GitHub Pages (see MIGRATION.md).
- [ ] **GitHub profile.** Add it to `profiles` in `src/_data/site.json` if you want it linked.
- [ ] **Slides links.** 11 entries link slides hosted at `wwwinfo.deis.unical.it/parisi/slides/` (taken from the old Publications page). I could not reach that server to check them; remove the `slides` field of any that no longer loads.
- [ ] **Under-review papers.** TPAMI (Even-if Explanations), ACM CSUR (survey), EDBT 2027 demo and the AAAI 2027 W2PC paper are in `publications.bib` with `hidden = {true}`. Delete that line from an entry to show it once it is accepted, or once you decide to list it.
- [ ] **English CV.** The PDF on the site is the Italian CV (cleaned, see below). The English CV on WordPress dates from September 2022; add an updated one if you want both.

## Conflicts between sources (resolved as shown; please confirm)

- **Job title.** WordPress: "Assistant Professor in Tenure Track". CV: "Ricercatore a tempo determinato in Tenure Track". Site: "Tenure-Track Assistant Professor (RTT)".
- **Bio numbers.** WordPress says "over 50 scientific papers (H-index 18)" with venue counts. These are outdated and the h-index is not in the CV, so the numbers are not on the site.
- **Office.** WordPress: "cubo 44". CV: "Cubo 44Z, piano I". Site uses the CV.
- **FQAS 2019.** The CV calls it the 12th edition (organization section) and the 13th (PC list and publication); WordPress says 13th. Site uses 13th.
- **IBERAMIA 2020.** CV and WordPress write "IBERIAMA"; the conference acronym is IBERAMIA. Site uses IBERAMIA.
- **Universidad Nacional del Sur.** The CV writes "Univesidad/Universidad National del Sur"; site uses the institution's name, Universidad Nacional del Sur.
- **Thesis P. Pangallo** (a.a. 2023/24) is on the WordPress Tesisti page but not in the CV. It is listed on the Teaching page.
- **Theses in progress** (V. Iusi, LM; R. Celsi, L) have no title in the CV: left out.
- **ASN dates.** The CV gives 25 May 2023 for 09/H1 with validity until 6 February 2034, while a commented line gives 6 February 2023. The site says only "2023".
- **AI\*IA talks.** The CV lists "XXI AI\*IA, Udine, Novembre 2023" (should be 2022) and a "XIX AI\*IA, Rende, 2019" that duplicates the 18th edition. Not on the site (only aggregated talk years are shown); fix in the CV.
- **TPLP 2020.** The CV gives "Volume 5, Issue 5"; the correct volume is 20(5), as on WordPress. Fix in the CV.
- **Intelligenza Artificiale 2018.** WordPress gives "Vol. 2(2)", the CV "vol. 12, no. 2". Site uses the CV.

## Changes made to the publication list (from CV.tex to publications.bib)

- 95 numbered CV entries became 79 BibTeX records, 75 of them shown:
  - 14 posters left out: each duplicates a conference paper already listed.
  - ICLP 2024 paper merged into the TPLP 2024 article, with a note.
  - arXiv report of the ICLP 2020 paper merged into the TPLP 2020 article (arXiv link).
  - 4 under-review entries hidden (see above).
- Venue names normalised to "Proceedings of the Nth ... (ACRONYM YEAR)". Ordinals corrected (31th, 32th, 33th to 31st, 32nd, 33rd) or added where the CV omits them:
  - IJCAI 2017 = 26th and IJCAI 2019 = 28th, derived from 30th = 2021 in the CV.
  - AAMAS 2024 = 23rd, derived from AAMAS 2023 = 22nd in the CV talks list.
  - SEBD 2018 = 26th, derived from 29th = 2021.
  - AI³ 2017 = 1st, derived from 2nd = 2018.
  - IDEAS 2018 = 22nd, from WordPress.
  - COMMA 2020 = 8th, from the CV reviewing list.
  - Please check the derived ones.
- IJCAI 2022 is named IJCAI-ECAI 2022, as on WordPress.
- DOIs cleaned: stray `}` (GDN 2019, Intelligenza Artificiale 2018), trailing period (KR 2024), LaTeX escapes (FQAS 2019).
- JLC 2026, IJCAI-ECAI 2026 and IJCAI 2024 have no DOI in the CV. Add `doi = {...}` when available.
- Name variants unified: Guillermo Ricardo Simari, Gerardo I. Simari, Mario A. Leiva.
- The DReLU preprint is listed as arXiv 2605.02551 without naming the venue it is under review at.
- Recommended: compare `publications.bib` with your DBLP export once, and keep DBLP as the reference for future entries.

## Public CV (src/assets/files/cv-alfano.pdf)

Compiled from a cleaned copy of CV.tex:
- **Removed:**
  - personal data: date and place of birth, citizenship, home address, tax code, marital status, military status, mobile number;
  - all comment lines and all "DA VERIFICARE" notes;
  - the paragraph on the European proposal (flagged as outdated);
  - the two theses without a title, and students' ID numbers;
  - the student evaluation section;
  - the data-processing consent and signatures.
- **Changed:**
  - the venues of conference submissions under review (AAAI 2027, AAMAS 2027, EDBT 2027) are replaced by "Sottomesso per la pubblicazione";
  - blue revision colouring is removed;
  - TPLP 2024 is marked as published.
- The Italian babel package was not available where the PDF was built, so hyphenation follows English rules. Recompiling the same file on your machine gives a better result.

## Not on the site, by choice

Student evaluations, attended schools and seminars, exam committees, the list of courses for which you sat on exam boards, and hours per project.
