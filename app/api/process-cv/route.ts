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
      Actúa como un reclutador experto y redactor de CVs profesional.
Tu objetivo es reescribir y optimizar un CV existente ({cv_text}) para que tenga la máxima compatibilidad con una oferta de trabajo específica ({job_offer}).

**Contexto:**
El candidato debe destacar por sus logros cuantificables y el uso de palabras clave exactas encontradas en la oferta para pasar los filtros ATS (Applicant Tracking Systems).

**Instrucciones de Redacción:**
1.  **Análisis de Keywords:** Identifica las habilidades técnicas y blandas críticas en la {job_offer} e intégralas naturalmente en el perfil y la experiencia.
2.  **Enfoque en Logros:** Transforma las listas de tareas en declaraciones de impacto. Usa verbos de acción fuertes (ej. Lideré, Desarrollé, Incrementé) .
3.  **Veracidad:** Basa todo el contenido estrictamente en la información provista en {cv_text}. Si falta una habilidad requerida, resalta habilidades transferibles existentes sin fabricar datos.
4.  **Formato de Salida:** Genera únicamente el CV en formato Markdown limpio.

**Ejemplo de Estilo (One-Shot):**
* *Entrada (Original):* "Encargado de ventas y hablar con clientes."
* *Salida (Mejorada):* "Gestioné una cartera de 50+ clientes clave, incrementando la retención en un 15% anual mediante estrategias de comunicación efectiva."

**Datos de Entrada:**

--- OFERTA DE TRABAJO ---
${jobOffer}

--- CV ORIGINAL ---
${cvText}

**Salida:**
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

    // Advanced Markdown Analysis and Rendering for Tables
    interface MarkdownSegment {
      text: string;
      style: 'bold' | 'italic' | 'code' | 'normal';
    }

    interface CellAnalysis {
      original: string;
      hasMarkdown: boolean;
      isValid: boolean;
      segments: MarkdownSegment[];
      error?: string;
    }

    const analyzeCellContent = (text: string): CellAnalysis => {
      // 1. Identify patterns
      const hasBold = /\*\*.*?\*\*/.test(text);
      const hasItalic = /(?<!\*)\*[^*]+\*(?!\*)/.test(text); // Single asterisks not part of double
      const hasCode = /`.*?`/.test(text);
      const hasMarkdown = hasBold || hasItalic || hasCode;

      if (!hasMarkdown) {
        return {
          original: text,
          hasMarkdown: false,
          isValid: true,
          segments: [{ text, style: 'normal' }]
        };
      }

      // 2. Verify structure (simple validation)
      // Check for unbalanced markers
      const boldCount = (text.match(/\*\*/g) || []).length;
      const codeCount = (text.match(/`/g) || []).length;
      
      let isValid = true;
      let error = undefined;

      if (boldCount % 2 !== 0) {
        isValid = false;
        error = "Unbalanced bold markers (**)";
      } else if (codeCount % 2 !== 0) {
        isValid = false;
        error = "Unbalanced code markers (`)";
      }

      // Use the existing logic to parse if valid, or treat as plain text if invalid
      let segments: MarkdownSegment[] = [];
      if (isValid) {
        // Reuse the logic from processInlineMarkdown but refined
        segments = processInlineMarkdown(text) as MarkdownSegment[];
      } else {
        segments = [{ text, style: 'normal' }];
      }

      return {
        original: text,
        hasMarkdown,
        isValid,
        segments,
        error
      };
    };

    // Helper to wrap styled text into lines that fit the column width
    const wrapStyledText = (segments: MarkdownSegment[], maxWidth: number, fontSize: number): MarkdownSegment[][] => {
      const lines: MarkdownSegment[][] = [];
      let currentLine: MarkdownSegment[] = [];
      let currentLineWidth = 0;
      const spaceWidth = doc.getStringUnitWidth(' ') * fontSize / doc.internal.scaleFactor;

      segments.forEach(segment => {
        // Set font for measurement
        if (segment.style === 'bold') doc.setFont("helvetica", "bold");
        else if (segment.style === 'italic') doc.setFont("helvetica", "italic");
        else if (segment.style === 'code') doc.setFont("courier", "normal");
        else doc.setFont("helvetica", "normal");

        const words = segment.text.split(' ');
        
        words.forEach((word, wordIndex) => {
          const wordWidth = doc.getStringUnitWidth(word) * fontSize / doc.internal.scaleFactor;
          
          // Add space width if not the first word in the segment
          const additionalWidth = (wordIndex > 0 || currentLine.length > 0) ? spaceWidth : 0;
          
          if (currentLineWidth + additionalWidth + wordWidth > maxWidth) {
            // Push current line and start new one
            if (currentLine.length > 0) {
              lines.push(currentLine);
              currentLine = [];
              currentLineWidth = 0;
            }
            
            // If word itself is too long, we might need to split it (basic char splitting could be added here)
            // For now, we put it on the next line
            currentLine.push({ text: word, style: segment.style });
            currentLineWidth = wordWidth;
          } else {
            // Add to current line
            if (currentLine.length > 0 || wordIndex > 0) {
               // We need to handle spaces carefully. 
               // For simplicity in this structure, we append the space to the previous item or start of this one.
               // Better: Add a separate space segment or prepend space to word
               if (currentLineWidth > 0) {
                 // Append space to the last element of currentLine if possible, or add a space segment
                 // But wait, segments have styles. A space should inherit style or be neutral.
                 // Let's just prepend space to the word text if it's not the start of line
                 currentLine.push({ text: ' ' + word, style: segment.style });
                 currentLineWidth += spaceWidth + wordWidth;
               } else {
                 currentLine.push({ text: word, style: segment.style });
                 currentLineWidth += wordWidth;
               }
            } else {
              currentLine.push({ text: word, style: segment.style });
              currentLineWidth += wordWidth;
            }
          }
        });
      });

      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      return lines;
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

      // Improved parsing logic for Markdown tables
      const parseRow = (line: string) => {
        const cells = line.split('|');
        // Remove first and last empty strings if they exist (common in markdown tables like | a | b |)
        if (cells.length > 1 && cells[0].trim() === '') cells.shift();
        if (cells.length > 1 && cells[cells.length - 1].trim() === '') cells.pop();
        return cells.map(c => c.trim());
      };

      // Parse table structure
      const rows: string[][] = [];
      const headerRow = parseRow(tableLines[0]);
      rows.push(headerRow);

      // Skip separator line (tableLines[1]) and parse data rows
      for (let i = 2; i < tableLines.length; i++) {
        const cells = parseRow(tableLines[i]);
        // Only add if it has content (flexible check)
        if (cells.some(c => c.length > 0)) {
          rows.push(cells);
        }
      }

      const numColumns = headerRow.length;
      if (numColumns === 0) return startY;

      const tableWidth = maxWidth - 10;
      const columnWidth = tableWidth / numColumns;
      const cellPadding = 2;
      
      let currentY = startY;

      // Report analysis data
      const analysisReport: { row: number, col: number, analysis: CellAnalysis }[] = [];

      // Helper to render a cell with markdown support
      const renderCell = (cellText: string, x: number, y: number, width: number, fontSize: number, isHeader: boolean) => {
        const analysis = analyzeCellContent(cellText);
        
        // Store analysis for report (only if interesting)
        if (analysis.hasMarkdown || !analysis.isValid) {
           // We can't easily get absolute row/col index here without passing it, but this is for internal logic
        }

        const segments = analysis.isValid ? analysis.segments : [{ text: cellText, style: 'normal' }];
        const wrappedLines = wrapStyledText(segments as MarkdownSegment[], width, fontSize);
        
        let lineY = y + (fontSize * 0.4); // Baseline offset

        wrappedLines.forEach(lineSegments => {
          let currentX = x;
          lineSegments.forEach(segment => {
            if (segment.style === 'bold') {
              doc.setFont("helvetica", "bold");
            } else if (segment.style === 'italic') {
              doc.setFont("helvetica", "italic");
            } else if (segment.style === 'code') {
              doc.setFont("courier", "normal");
              // Code often needs slightly smaller font
            } else {
              doc.setFont("helvetica", isHeader ? "bold" : "normal");
            }
            
            doc.text(segment.text, currentX, lineY);
            currentX += doc.getTextWidth(segment.text);
          });
          lineY += 4; // Line height
        });
      };

      // Function to calculate row height based on content
      const getRowHeight = (row: string[], fontSize: number) => {
        let maxLines = 1;
        row.forEach((cell, index) => {
           // Handle case where row has fewer columns than header
           if (index >= numColumns) return; 
           
           const textWidth = columnWidth - (cellPadding * 2);
           const analysis = analyzeCellContent(cell);
           const segments = analysis.isValid ? analysis.segments : [{ text: cell, style: 'normal' }];
           const lines = wrapStyledText(segments as MarkdownSegment[], textWidth, fontSize);
           
           if (lines.length > maxLines) maxLines = lines.length;
        });
        // Line height factor (approx 1.15 * fontSize) + padding
        const lineHeight = 4; 
        return (maxLines * lineHeight) + 6; // +6 for top/bottom padding
      };

      // Draw Header function
      const drawHeader = (y: number) => {
        const rowHeight = getRowHeight(headerRow, 9);
        
        // Background
        doc.setFillColor(240, 240, 240);
        doc.rect(margin + 5, y, tableWidth, rowHeight, 'F');
        
        doc.setFontSize(9);
        // Font style is handled per segment in renderCell, but default for header is bold
        doc.setTextColor(...colors.accent);
        
        // Borders (Outer rect for this row)
        doc.setDrawColor(...colors.secondary);
        doc.setLineWidth(0.2);
        doc.rect(margin + 5, y, tableWidth, rowHeight);
        
        // Vertical lines
        for (let i = 1; i < numColumns; i++) {
          const lineX = margin + 5 + (i * columnWidth);
          doc.line(lineX, y, lineX, y + rowHeight);
        }

        headerRow.forEach((cell, colIndex) => {
          if (colIndex >= numColumns) return;
          const x = margin + 5 + (colIndex * columnWidth) + cellPadding;
          const textWidth = columnWidth - (cellPadding * 2);
          
          // Use renderCell instead of simple text
          renderCell(cell, x, y + 5, textWidth, 9, true);
        });
        
        return rowHeight;
      };

      // Calculate header height to check page break for initial render
      const initialHeaderHeight = getRowHeight(headerRow, 9);
      
      // Check if we need a new page for the start of the table
      if (currentY + initialHeaderHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }

      // Draw Header initially
      currentY += drawHeader(currentY);

      // Draw Data Rows
      doc.setTextColor(...colors.text);
      doc.setFontSize(8);

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const rowHeight = getRowHeight(row, 8);

        // Check Page Break
        if (currentY + rowHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
          
          // Redraw header on new page
          currentY += drawHeader(currentY);
          
          // Reset font for data
          doc.setTextColor(...colors.text);
          doc.setFontSize(8);
        }

        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin + 5, currentY, tableWidth, rowHeight, 'F');
        }

        // Draw Borders for this row
        doc.setDrawColor(...colors.secondary);
        doc.setLineWidth(0.2);
        doc.rect(margin + 5, currentY, tableWidth, rowHeight);
        
        // Vertical lines
        for (let i = 1; i < numColumns; i++) {
          const lineX = margin + 5 + (i * columnWidth);
          doc.line(lineX, currentY, lineX, currentY + rowHeight);
        }

        // Draw Content
        row.forEach((cell, colIndex) => {
          if (colIndex >= numColumns) return;
          const x = margin + 5 + (colIndex * columnWidth) + cellPadding;
          const textWidth = columnWidth - (cellPadding * 2);
          
          // Analyze and log for report
          const analysis = analyzeCellContent(cell);
          if (analysis.hasMarkdown || !analysis.isValid) {
            analysisReport.push({ row: rowIndex, col: colIndex, analysis });
          }

          renderCell(cell, x, currentY + 5, textWidth, 8, false);
        });

        currentY += rowHeight;
      }

      // Log analysis report to console (server-side)
      if (analysisReport.length > 0) {
        console.log("Markdown Table Analysis Report:");
        analysisReport.forEach(item => {
          console.log(`Row ${item.row}, Col ${item.col}:`);
          console.log(`  Original: "${item.analysis.original}"`);
          console.log(`  Valid: ${item.analysis.isValid}`);
          if (!item.analysis.isValid) console.log(`  Error: ${item.analysis.error}`);
          console.log(`  Segments: ${JSON.stringify(item.analysis.segments)}`);
          console.log("---");
        });
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
