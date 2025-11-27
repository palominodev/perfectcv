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

    // 3. Generate PDF using jsPDF with enhanced formatting
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = 20;

    // Professional color palette
    const colors = {
      primary: [41, 98, 255] as [number, number, number], // Professional blue
      secondary: [96, 96, 96] as [number, number, number], // Dark gray
      accent: [0, 0, 0] as [number, number, number], // Black
      text: [51, 51, 51] as [number, number, number], // Dark gray text
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (neededSpace: number, isTitle: boolean = false) => {
      // For titles, we need more space to avoid orphans
      const threshold = isTitle ? neededSpace + 20 : neededSpace;
      if (yPosition + threshold > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to process inline markdown (bold, italic, code)
    const processInlineMarkdown = (text: string): Array<{text: string, style: string}> => {
      const segments: Array<{text: string, style: string}> = [];
      let currentText = text;
      let currentIndex = 0;

      // Match bold (**text**), italic (*text*), and code (`text`)
      const pattern = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
      const matches = Array.from(currentText.matchAll(pattern));

      if (matches.length === 0) {
        return [{text: currentText, style: 'normal'}];
      }

      matches.forEach((match) => {
        const matchText = match[0];
        const matchIndex = match.index!;

        // Add text before the match
        if (matchIndex > currentIndex) {
          segments.push({
            text: currentText.substring(currentIndex, matchIndex),
            style: 'normal'
          });
        }

        // Add the matched text with appropriate style
        if (matchText.startsWith('**') && matchText.endsWith('**')) {
          segments.push({
            text: matchText.slice(2, -2),
            style: 'bold'
          });
        } else if (matchText.startsWith('*') && matchText.endsWith('*') && !matchText.startsWith('**')) {
          segments.push({
            text: matchText.slice(1, -1),
            style: 'italic'
          });
        } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
          segments.push({
            text: matchText.slice(1, -1),
            style: 'code'
          });
        }

        currentIndex = matchIndex + matchText.length;
      });

      // Add remaining text
      if (currentIndex < currentText.length) {
        segments.push({
          text: currentText.substring(currentIndex),
          style: 'normal'
        });
      }

      return segments;
    };

    // Helper function to add styled text with inline formatting
    const addStyledText = (text: string, x: number, y: number, fontSize: number, baseStyle: string, maxWidth: number) => {
      const segments = processInlineMarkdown(text);
      let currentX = x;
      
      doc.setFontSize(fontSize);
      
      segments.forEach((segment) => {
        if (segment.text.length === 0) return;

        // Set font based on style
        if (segment.style === 'bold') {
          doc.setFont("helvetica", "bold");
        } else if (segment.style === 'italic') {
          doc.setFont("helvetica", "italic");
        } else if (segment.style === 'code') {
          doc.setFont("courier", "normal");
          doc.setFontSize(fontSize - 1);
        } else {
          doc.setFont("helvetica", baseStyle as any);
        }

        // Calculate text width and handle wrapping
        const textWidth = doc.getTextWidth(segment.text);
        
        // Simple approach: if text fits, add it; otherwise wrap to next line
        if (currentX + textWidth > x + maxWidth && currentX > x) {
          y += fontSize * 0.4;
          currentX = x;
        }

        doc.text(segment.text, currentX, y);
        currentX += textWidth;

        // Reset font size if it was changed for code
        if (segment.style === 'code') {
          doc.setFontSize(fontSize);
        }
      });

      return y;
    };

    // Helper function to render a markdown table
    const renderTable = (tableLines: string[], startY: number) => {
      if (tableLines.length < 2) return startY; // Need at least header and separator

      // Parse table structure
      const rows: string[][] = [];
      const headerRow = tableLines[0]
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
      
      rows.push(headerRow);

      // Skip separator line (tableLines[1]) and parse data rows
      for (let i = 2; i < tableLines.length; i++) {
        const cells = tableLines[i]
          .split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);
        if (cells.length > 0) {
          rows.push(cells);
        }
      }

      const numColumns = headerRow.length;
      const tableWidth = maxWidth - 10;
      const columnWidth = tableWidth / numColumns;
      const rowHeight = 7;
      const cellPadding = 2;

      let currentY = startY;

      // Check if entire table fits on current page, otherwise add new page
      const tableHeight = rows.length * rowHeight + 5;
      checkPageBreak(tableHeight, true);
      currentY = yPosition;

      // Draw header row with background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin + 5, currentY - 5, tableWidth, rowHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);

      headerRow.forEach((cell, colIndex) => {
        const x = margin + 5 + (colIndex * columnWidth) + cellPadding;
        const cellText = doc.splitTextToSize(cell, columnWidth - (cellPadding * 2));
        doc.text(cellText[0] || '', x, currentY, { maxWidth: columnWidth - (cellPadding * 2) });
      });

      currentY += rowHeight;

      // Draw data rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.text);
      doc.setFontSize(8);

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        
        // Alternate row background for better readability
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin + 5, currentY - 5, tableWidth, rowHeight, 'F');
        }

        row.forEach((cell, colIndex) => {
          const x = margin + 5 + (colIndex * columnWidth) + cellPadding;
          const cellText = doc.splitTextToSize(cell, columnWidth - (cellPadding * 2));
          doc.text(cellText[0] || '', x, currentY, { maxWidth: columnWidth - (cellPadding * 2) });
        });

        currentY += rowHeight;
      }

      // Draw table borders
      doc.setDrawColor(...colors.secondary);
      doc.setLineWidth(0.2);
      
      // Outer border
      doc.rect(margin + 5, startY - 5, tableWidth, currentY - startY);
      
      // Column separators
      for (let i = 1; i < numColumns; i++) {
        const x = margin + 5 + (i * columnWidth);
        doc.line(x, startY - 5, x, currentY);
      }
      
      // Row separators
      let separatorY = startY - 5;
      for (let i = 0; i <= rows.length; i++) {
        doc.line(margin + 5, separatorY, margin + 5 + tableWidth, separatorY);
        separatorY += rowHeight;
      }

      return currentY + 5;
    };

    const lines = optimizedMarkdown.split("\n");
    let listCounter = 0;
    let inOrderedList = false;
    let tableBuffer: string[] = [];
    let inTable = false;
    
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Detect tables (lines with pipes)
      const isTableLine = trimmedLine.includes('|') && trimmedLine.split('|').length >= 3;
      
      if (isTableLine) {
        if (!inTable) {
          inTable = true;
          tableBuffer = [];
        }
        tableBuffer.push(trimmedLine);
        continue;
      } else if (inTable) {
        // End of table, render it
        if (tableBuffer.length >= 2) {
          yPosition = renderTable(tableBuffer, yPosition);
          doc.setTextColor(...colors.text); // Reset text color after table
        }
        inTable = false;
        tableBuffer = [];
      }

      // Skip empty lines but add spacing
      if (trimmedLine.length === 0) {
        yPosition += 3;
        inOrderedList = false;
        listCounter = 0;
        continue;
      }

      // Main title (H1) - Name/Header
      if (line.startsWith("# ")) {
        checkPageBreak(25, true);
        const text = line.replace("# ", "").trim();
        
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.primary);
        
        doc.text(text, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 8;
        
        // Add decorative line under name
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 30, yPosition, pageWidth / 2 + 30, yPosition);
        yPosition += 12;
        
        doc.setTextColor(...colors.text);
        inOrderedList = false;

      // Section headers (H2)
      } else if (line.startsWith("## ")) {
        checkPageBreak(20, true);
        const text = line.replace("## ", "").trim();
        
        yPosition += 5; // Extra space before section
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.secondary);
        
        doc.text(text.toUpperCase(), margin, yPosition);
        yPosition += 6;
        
        // Add separator line
        doc.setDrawColor(...colors.secondary);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        doc.setTextColor(...colors.text);
        inOrderedList = false;

      // Subsection headers (H3)
      } else if (line.startsWith("### ")) {
        checkPageBreak(15, true);
        const text = line.replace("### ", "").trim();
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.accent);
        
        addStyledText(text, margin, yPosition, 12, "bold", maxWidth);
        yPosition += 9;
        
        doc.setTextColor(...colors.text);
        inOrderedList = false;

      // Bulleted lists
      } else if (line.match(/^\s*[-*]\s/)) {
        checkPageBreak(10);
        const indent = (line.length - line.trimStart().length) / 2;
        const text = line.replace(/^\s*[-*]\s/, "").trim();
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        const bulletX = margin + 5 + (indent * 10);
        doc.text("•", bulletX, yPosition);
        
        const textLines = doc.splitTextToSize(text, maxWidth - 15 - (indent * 10));
        textLines.forEach((textLine: string, idx: number) => {
          checkPageBreak(5);
          addStyledText(textLine, bulletX + 5, yPosition + (idx * 5), 10, "normal", maxWidth - 15 - (indent * 10));
        });
        
        yPosition += textLines.length * 5 + 2;
        inOrderedList = false;

      // Numbered lists
      } else if (line.match(/^\s*\d+\.\s/)) {
        checkPageBreak(10);
        const match = line.match(/^\s*(\d+)\.\s(.*)$/);
        if (match) {
          const number = match[1];
          const text = match[2].trim();
          
          if (!inOrderedList) {
            listCounter = parseInt(number);
            inOrderedList = true;
          } else {
            listCounter++;
          }
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          
          doc.text(`${listCounter}.`, margin + 5, yPosition);
          
          const textLines = doc.splitTextToSize(text, maxWidth - 15);
          textLines.forEach((textLine: string, idx: number) => {
            checkPageBreak(5);
            addStyledText(textLine, margin + 15, yPosition + (idx * 5), 10, "normal", maxWidth - 15);
          });
          
          yPosition += textLines.length * 5 + 2;
        }

      // Regular paragraphs
      } else {
        checkPageBreak(10);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        const textLines = doc.splitTextToSize(trimmedLine, maxWidth);
        textLines.forEach((textLine: string, idx: number) => {
          checkPageBreak(5);
          addStyledText(textLine, margin, yPosition + (idx * 5), 10, "normal", maxWidth);
        });
        
        yPosition += textLines.length * 5 + 3;
        inOrderedList = false;
      }
    }

    // Render any remaining table at the end
    if (inTable && tableBuffer.length >= 2) {
      yPosition = renderTable(tableBuffer, yPosition);
    }

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
