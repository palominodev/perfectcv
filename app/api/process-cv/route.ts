import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsPDF } from "jspdf";
// @ts-ignore
import pdfParse from "pdf-parse-fork";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const jobOffer = formData.get("jobOffer") as string;

    if (!file || !jobOffer) {
      return NextResponse.json(
        { error: "File and job offer are required" },
        { status: 400 }
      );
    }

    // 1. Extract text from PDF using pdf-parse-fork
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const cvText = pdfData.text;

    // 2. Optimize with Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Actúa como un experto redactor de CVs y reclutador.
      Tu tarea es optimizar el siguiente CV para que se ajuste perfectamente a la oferta de trabajo proporcionada.
      
      Oferta de Trabajo:
      ${jobOffer}

      CV Original:
      ${cvText}

      Instrucciones:
      1. Analiza la oferta de trabajo para identificar palabras clave y habilidades requeridas.
      2. Reescribe el CV para resaltar la experiencia y habilidades relevantes del candidato que coincidan con la oferta.
      3. Mejora la redacción para que sea profesional, clara y orientada a logros.
      4. Mantén la estructura general de un CV (Perfil, Experiencia, Educación, Habilidades), pero optimiza el contenido.
      5. NO inventes información falsa, solo resalta y reformula lo que ya existe en el CV original.
      6. La salida debe ser exclusivamente el contenido del CV en formato Markdown limpio. No incluyas explicaciones adicionales ni bloques de código markdown (\`\`\`).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const optimizedMarkdown = response.text().replace(/```markdown/g, "").replace(/```/g, "");

    // 3. Generate PDF using jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = 20;

    const lines = optimizedMarkdown.split("\n");
    
    lines.forEach((line) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      if (line.startsWith("# ")) {
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        const text = line.replace("# ", "");
        doc.text(text, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 10;
      } else if (line.startsWith("## ")) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const text = line.replace("## ", "");
        doc.text(text, margin, yPosition, { maxWidth });
        yPosition += 8;
      } else if (line.startsWith("### ")) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const text = line.replace("### ", "");
        doc.text(text, margin, yPosition, { maxWidth });
        yPosition += 7;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const text = `• ${line.substring(2)}`;
        const splitText = doc.splitTextToSize(text, maxWidth - 10);
        doc.text(splitText, margin + 5, yPosition);
        yPosition += splitText.length * 5;
      } else if (line.trim().length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(line, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 5 + 2;
      }
    });

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // 4. Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="cv-optimizado.pdf"',
      },
    });

  } catch (error) {
    console.error("Error processing CV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
