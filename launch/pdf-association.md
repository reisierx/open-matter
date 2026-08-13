Subject: Guest article: putting the agent index inside the PDF

Hello,

I am Gonçalo, in Lisbon. I have been reading the Association’s pieces on non-human PDF readers and on the cost of treating every document task as an LLM problem — in particular “Reading PDFs in the car.”

I have drafted a small, vendor-neutral convention called open-matter. It uses the EmbeddedFiles name tree (PDF 1.4) to attach a reserved YAML file, `open-matter.yaml`, to the document. The PDF remains valid and renders identically. The card tells software what the document is and where the sections live, so a later read does not have to pay the full parse again.

The point is not a new format. DocLang, which the Linux Foundation launched this spring, is the representation. open-matter is the carrier: a place inside the circulating file so that representation cannot be orphaned. Sidecars get lost. Application intelligence stays behind a subscription. This stays in the file.

I would like to offer a guest article for pdfa.org: why the next reader may not be human, why XMP and the Info dictionary are the wrong shelf, and why a 1 KB attachment is a better answer than converting the world’s PDFs into something else.

The draft spec is CC0. Live text is at https://open-matter.org/spec. I can send a 1 200-word piece next week, or adapt to your house length.

Gonçalo
