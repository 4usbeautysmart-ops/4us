
import type { CuttingPlan, VisagismReport, ColoristReport, HairstylistReport } from '../types';

export async function generatePdf(
  plan: CuttingPlan,
  referenceImage: string,
  resultImage: string | null
): Promise<void> {
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  // @ts-ignore
  const html2canvas = window.html2canvas;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = margin;

  // --- Helpers ---
  const addText = (text: string, size: number, style: 'bold' | 'normal', x: number, y: number, options: any = {}) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
    doc.text(splitText, x, y, options);
    return (splitText.length * (size * 0.35)) + 2; // Return height of the text block
  };

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };
  
  // --- Header ---
  doc.setDrawColor(16, 185, 129); // Emerald color
  doc.setLineWidth(1);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  yPos += addText(plan.styleName, 22, 'bold', margin, yPos);
  yPos += 2;
  yPos += addText(plan.description, 11, 'normal', margin, yPos);
  yPos += 5;
  doc.setDrawColor(209, 213, 219); // Gray color
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // --- Images ---
  checkPageBreak(80);
  const imageWidth = (pageWidth - (margin * 3)) / 2;
  const imageHeight = 75;
  
  yPos += addText('Imagens de Referência e Resultado', 14, 'bold', margin, yPos);
  
  if (referenceImage) {
    doc.addImage(`data:image/jpeg;base64,${referenceImage}`, 'JPEG', margin, yPos, imageWidth, imageHeight);
  }
  if (resultImage) {
    doc.addImage(resultImage, 'JPEG', margin + imageWidth + margin, yPos, imageWidth, imageHeight);
  }
  yPos += imageHeight + 8;

  // --- Tools ---
  checkPageBreak(20);
  yPos += addText('Ferramentas Necessárias', 14, 'bold', margin, yPos);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  plan.tools.forEach(tool => {
      checkPageBreak(6);
      doc.text(`• ${tool}`, margin + 5, yPos);
      yPos += 6;
  });
  yPos += 8;
  
  // --- Steps ---
  checkPageBreak(20);
  yPos += addText('Passo a Passo', 14, 'bold', margin, yPos);
  plan.steps.forEach((step, index) => {
    const stepText = `${index + 1}. ${step}`;
    const textLines = doc.splitTextToSize(stepText, pageWidth - margin - (margin + 5));
    const textHeight = textLines.length * (10 * 0.35) + 4;
    checkPageBreak(textHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(textLines, margin, yPos);
    yPos += textHeight;
  });
  yPos += 8;

  // --- Diagrams ---
  checkPageBreak(20);
  yPos += addText('Diagramas', 14, 'bold', margin, yPos);
  
  const diagramContainer = document.createElement('div');
  diagramContainer.style.position = 'absolute';
  diagramContainer.style.left = '-9999px';
  diagramContainer.style.top = '-9999px';
  document.body.appendChild(diagramContainer);

  for (const diagram of plan.diagrams) {
    const svgDiv = document.createElement('div');
    svgDiv.style.width = '250px';
    svgDiv.style.height = '250px';
    svgDiv.style.backgroundColor = 'white';
    svgDiv.style.padding = '10px';
    svgDiv.innerHTML = diagram.svg;
    diagramContainer.appendChild(svgDiv);
    
    const canvas = await html2canvas(svgDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    
    diagramContainer.removeChild(svgDiv);

    const diagramHeight = 70;
    const diagramWidth = (canvas.width * diagramHeight) / canvas.height;
    
    checkPageBreak(diagramHeight + 10); // height + title
    yPos += addText(diagram.title, 11, 'bold', margin, yPos);

    doc.addImage(imgData, 'PNG', margin, yPos, diagramWidth, diagramHeight);
    yPos += diagramHeight + 8;
  }

  document.body.removeChild(diagramContainer);

  // --- Save ---
  doc.save(`plano-de-corte-${plan.styleName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}


export async function generateVisagismPdf(
  report: VisagismReport,
  clientImage: string
): Promise<Blob> {
  // @ts-ignore
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = margin;
  const colWidth = (pageWidth - margin * 3) / 2;

  // --- Helpers ---
  const addText = (text: string, size: number, style: 'bold' | 'normal' | 'italic', x: number, y: number, maxWidth?: number) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, maxWidth || (pageWidth - margin * 2));
    doc.text(splitText, x, y);
    return (splitText.length * (size * 0.35)) + 2;
  };
  
  const addSectionTitle = (title: string) => {
     checkPageBreak(15);
     doc.setDrawColor(209, 213, 219);
     doc.setLineWidth(0.2);
     doc.line(margin, yPos, pageWidth - margin, yPos);
     yPos += 8;
     yPos += addText(title, 14, 'bold', margin, yPos);
  }

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // --- Header ---
  doc.setDrawColor(16, 185, 129); // Emerald color
  doc.setLineWidth(1);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  yPos += addText('Relatório de Visagismo', 22, 'bold', margin, yPos);
  yPos += 2;
  yPos += addText(`Análise para Rosto ${report.faceShape}`, 11, 'normal', margin, yPos);
  yPos += 5;
  
  // --- First Section: Image + Analysis ---
  checkPageBreak(80);
  const imageSize = 75;
  doc.addImage(clientImage, 'JPEG', margin, yPos, imageSize, imageSize);

  let rightColX = margin + imageSize + margin;
  let rightColY = yPos;

  rightColY += addText('Análise Facial', 12, 'bold', rightColX, rightColY);
  rightColY += addText(`• Forma do Rosto: ${report.faceShape}`, 10, 'normal', rightColX, rightColY);
  rightColY += addText(`• Testa: ${report.keyFacialFeatures.forehead}`, 10, 'normal', rightColX, rightColY);
  rightColY += addText(`• Maxilar: ${report.keyFacialFeatures.jawline}`, 10, 'normal', rightColX, rightColY);
  
  rightColY += 8;

  rightColY += addText('Análise Capilar', 12, 'bold', rightColX, rightColY);
  rightColY += addText(`• Tipo de Fio: ${report.hairAnalysis.hairType}`, 10, 'normal', rightColX, rightColY);
  rightColY += addText(`• Densidade: ${report.hairAnalysis.hairDensity}`, 10, 'normal', rightColX, rightColY);
  rightColY += addText(`• Condição Atual: ${report.hairAnalysis.currentCondition}`, 10, 'normal', rightColX, rightColY);

  yPos += imageSize + 5;

  // --- Style Recommendations ---
  addSectionTitle('Estilos que Valorizam');
  report.styleRecommendations.forEach(rec => {
    const titleHeight = 6;
    const descHeight = addText(rec.description, 10, 'normal', margin + 5, yPos + titleHeight, pageWidth - margin * 3);
    checkPageBreak(titleHeight + descHeight + 4);
    addText(`• ${rec.styleName} (${rec.category})`, 11, 'bold', margin, yPos);
    addText(rec.description, 10, 'normal', margin + 5, yPos + titleHeight, pageWidth - margin * 3);
    yPos += titleHeight + descHeight + 2;
  });

  // --- Styles to Avoid ---
  addSectionTitle('Estilos a Evitar');
  report.stylesToAvoid.forEach(rec => {
    const titleHeight = 6;
    const descHeight = addText(rec.description, 10, 'normal', margin + 5, yPos + titleHeight, pageWidth - margin * 3);
    checkPageBreak(titleHeight + descHeight + 4);
    addText(`• ${rec.styleName}`, 11, 'bold', margin, yPos);
    addText(rec.description, 10, 'normal', margin + 5, yPos + titleHeight, pageWidth - margin * 3);
    yPos += titleHeight + descHeight + 2;
  });
  
  // --- Additional Tips ---
  addSectionTitle('Dicas Adicionais');
  const leftTipY = yPos;
  const rightTipY = yPos;
  
  const makeupTitleHeight = addText('Maquiagem', 11, 'bold', margin, leftTipY, colWidth);
  let finalLeftY = leftTipY + makeupTitleHeight;
  report.makeupTips.forEach(tip => {
      finalLeftY += addText(`• ${tip}`, 10, 'normal', margin, finalLeftY, colWidth);
  });
  
  const accessoriesTitleHeight = addText('Acessórios', 11, 'bold', margin + colWidth + margin, rightTipY, colWidth);
  let finalRightY = rightTipY + accessoriesTitleHeight;
  report.accessoriesTips.forEach(tip => {
      finalRightY += addText(`• ${tip}`, 10, 'normal', margin + colWidth + margin, finalRightY, colWidth);
  });
  
  yPos = Math.max(finalLeftY, finalRightY) + 5;
  
  // --- Summary ---
  addSectionTitle('Resumo da Consultoria');
  yPos += addText(report.summary, 10, 'italic', margin, yPos);

  // --- Return as Blob ---
  return doc.output('blob');
}


export async function generateViabilityPdf(
  report: string,
  referenceImage: string,
  clientImage: string
): Promise<Blob> {
  // @ts-ignore
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = margin;

  // --- Helpers ---
  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  const addFormattedText = (text: string, x: number, maxWidth: number) => {
    const lines = text.split('\n');
    lines.forEach(line => {
        let style = 'normal';
        let size = 10;
        let processedLine = line.trim();

        if (processedLine.startsWith('###')) {
            style = 'bold';
            size = 12;
            processedLine = processedLine.replace('###', '').trim();
        } else if (processedLine.startsWith('-')) {
            processedLine = `• ${processedLine.substring(1).trim()}`;
        }
        
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '$1'); // Basic bold removal for now

        doc.setFontSize(size);
        doc.setFont('helvetica', style as 'bold' | 'normal');
        
        const splitText = doc.splitTextToSize(processedLine, maxWidth);
        const textHeight = (splitText.length * (size * 0.35)) + 2;
        checkPageBreak(textHeight);
        doc.text(splitText, x, yPos);
        yPos += textHeight;
    });
  };

  // --- Header ---
  doc.setDrawColor(16, 185, 129); // Emerald color
  doc.setLineWidth(1);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Viabilidade', margin, yPos);
  yPos += 10;
  doc.setDrawColor(209, 213, 219); // Gray color
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // --- Images ---
  checkPageBreak(85);
  const imageWidth = (pageWidth - (margin * 3)) / 2;
  const imageHeight = 75;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Corte Desejado (Referência)', margin, yPos);
  doc.text('Foto da Cliente', margin + imageWidth + margin, yPos);
  yPos += 5;

  doc.addImage(referenceImage, 'JPEG', margin, yPos, imageWidth, imageHeight);
  doc.addImage(clientImage, 'JPEG', margin + imageWidth + margin, yPos, imageWidth, imageHeight);
  yPos += imageHeight + 10;

  // --- Report Text ---
  addFormattedText(report, margin, pageWidth - margin * 2);

  // --- Return as Blob ---
  return doc.output('blob');
}

export async function generateColoristPdf(
  reportData: { report: ColoristReport; tryOnImage: string },
  clientImage: string
): Promise<Blob> {
  const { report, tryOnImage } = reportData;
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  // @ts-ignore
  const html2canvas = window.html2canvas;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = margin;

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };
  
  const addText = (text: string | string[], size: number, style: 'bold' | 'normal' | 'italic', x: number, maxWidth?: number) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, maxWidth || (pageWidth - margin * 2));
    checkPageBreak(splitText.length * size * 0.35 + 2);
    doc.text(splitText, x, yPos);
    yPos += (splitText.length * (size * 0.35)) + 2;
  };
  
  const addSectionTitle = (title: string) => {
    checkPageBreak(15);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    addText(title, 14, 'bold', margin);
  };

  // --- Header ---
  addText('Relatório de Colorimetria Expert', 22, 'bold', margin);
  yPos += 5;

  // --- Images ---
  checkPageBreak(85);
  const imageWidth = (pageWidth - (margin * 3)) / 2;
  const imageHeight = 75;
  addText('Antes e Depois', 11, 'bold', margin);
  doc.addImage(clientImage, 'JPEG', margin, yPos, imageWidth, imageHeight);
  doc.addImage(tryOnImage, 'JPEG', margin + imageWidth + margin, yPos, imageWidth, imageHeight);
  yPos += imageHeight + 8;
  
  // --- Analysis ---
  addSectionTitle('Análise de Visagismo e Colorimetria');
  addText(`Subtom de Pele: ${report.visagismAndColorimetryAnalysis.skinTone}`, 10, 'normal', margin);
  addText(`Contraste Pessoal: ${report.visagismAndColorimetryAnalysis.contrast}`, 10, 'normal', margin);
  addText(report.visagismAndColorimetryAnalysis.recommendation, 10, 'italic', margin, pageWidth - margin * 2 - 5);
  yPos += 5;
  
  // --- Diagnosis and Products ---
  addSectionTitle('Diagnóstico e Produtos');
  addText('Diagnóstico Inicial:', 11, 'bold', margin);
  addText(report.initialDiagnosis, 10, 'normal', margin + 4);
  yPos += 2;
  addText('Produtos Necessários:', 11, 'bold', margin);
  report.products.forEach(p => addText(`• ${p}`, 10, 'normal', margin + 4));
  yPos += 5;
  
  // --- Technique and Steps ---
  addSectionTitle(`Técnica de Mechas: ${report.mechasTechnique.name}`);
  addText(report.mechasTechnique.description, 10, 'normal', margin);
  yPos += 5;
  
  const steps = report.applicationSteps;
  const stepCategories = [
      { title: 'Preparação', steps: steps.preparation },
      { title: 'Aplicação das Mechas', steps: steps.mechas },
      { title: 'Aplicação da Cor de Base', steps: steps.baseColor },
      { title: 'Tonalização', steps: steps.toning },
      { title: 'Tratamento', steps: steps.treatment },
  ];

  stepCategories.forEach(cat => {
      if (cat.steps && cat.steps.length > 0) {
          addText(cat.title, 11, 'bold', margin);
          cat.steps.forEach(step => addText(`• ${step}`, 10, 'normal', margin + 4));
          yPos += 2;
      }
  });

  // --- Diagrams ---
  addSectionTitle('Diagramas da Técnica');
  const diagramContainer = document.createElement('div');
  diagramContainer.style.position = 'absolute';
  diagramContainer.style.left = '-9999px';
  document.body.appendChild(diagramContainer);

  for (const diagram of report.diagrams) {
    const svgDiv = document.createElement('div');
    svgDiv.style.width = '250px';
    svgDiv.style.height = '250px';
    svgDiv.style.backgroundColor = 'white';
    svgDiv.innerHTML = diagram.svg;
    diagramContainer.appendChild(svgDiv);
    
    const canvas = await html2canvas(svgDiv, { backgroundColor: '#ffffff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    diagramContainer.removeChild(svgDiv);

    const diagramHeight = 70;
    const diagramWidth = (canvas.width * diagramHeight) / canvas.height;
    
    checkPageBreak(diagramHeight + 15);
    addText(diagram.title, 11, 'bold', margin);
    doc.addImage(imgData, 'PNG', margin, yPos, diagramWidth, diagramHeight);
    yPos += diagramHeight + 8;
  }
  document.body.removeChild(diagramContainer);

  return doc.output('blob');
}

export async function generateHairstylistPdf(
  report: HairstylistReport,
  clientImage: string | null,
  referenceImage: string | null,
  realisticImage: string | null
): Promise<void> {
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  // @ts-ignore
  const html2canvas = window.html2canvas;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = margin;

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  const addText = (text: string, size: number, style: 'bold' | 'normal' | 'italic', x: number, maxWidth?: number) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, maxWidth || (pageWidth - margin * 2));
    const textHeight = (splitText.length * (size * 0.35)) + 2;
    checkPageBreak(textHeight);
    doc.text(splitText, x, yPos);
    yPos += textHeight;
  };

  const addSectionTitle = (title: string) => {
    checkPageBreak(15);
    if (yPos > margin + 5) { // Don't add a line at the very top of a new page
        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
    }
    addText(title, 14, 'bold', margin);
  };

  // --- HEADER ---
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  addText(`Plano de Corte: ${report.cuttingPlan.styleName}`, 22, 'bold', margin);
  addText(report.cuttingPlan.description, 11, 'italic', margin);
  yPos += 5;

  // --- IMAGES ---
  addSectionTitle('Visualização');
  const imageWidth = (pageWidth - (margin * 4)) / 3;
  const imageHeight = imageWidth;
  checkPageBreak(imageHeight + 10);
  
  if (clientImage) doc.addImage(clientImage, 'JPEG', margin, yPos, imageWidth, imageHeight);
  if (referenceImage) doc.addImage(referenceImage, 'JPEG', margin + imageWidth + margin, yPos, imageWidth, imageHeight);
  if (realisticImage) doc.addImage(realisticImage, 'PNG', margin + (imageWidth + margin) * 2, yPos, imageWidth, imageHeight);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Cliente', margin + imageWidth / 2, yPos + imageHeight + 4, { align: 'center' });
  doc.text('Referência', margin + imageWidth + margin + imageWidth / 2, yPos + imageHeight + 4, { align: 'center' });
  doc.text('Resultado (IA)', margin + (imageWidth + margin) * 2 + imageWidth / 2, yPos + imageHeight + 4, { align: 'center' });
  yPos += imageHeight + 10;

  // --- VIABILITY ---
  addSectionTitle('Análise de Viabilidade');
  const verdictColors: { [key: string]: number[] } = {
      'Altamente Recomendado': [16, 185, 129],
      'Recomendado com Adaptações': [245, 158, 11],
      'Não Recomendado': [220, 38, 38]
  };
  const verdictColor = verdictColors[report.viabilityAnalysis.verdict] || [107, 114, 128];
  doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.roundedRect(margin, yPos, 70, 8, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(report.viabilityAnalysis.verdict, margin + 5, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  addText('Justificativa:', 11, 'bold', margin);
  addText(report.viabilityAnalysis.justification, 10, 'normal', margin + 2);
  yPos += 2;
  if (report.viabilityAnalysis.adaptationRecommendations) {
    addText('Adaptações Recomendadas:', 11, 'bold', margin);
    addText(report.viabilityAnalysis.adaptationRecommendations, 10, 'normal', margin + 2);
    yPos += 2;
  }
  yPos += 5;

  // --- CUTTING PLAN ---
  addSectionTitle('Plano de Execução Técnico');
  addText('Ferramentas e Acessórios', 12, 'bold', margin);
  report.cuttingPlan.tools.concat(report.cuttingPlan.accessories).forEach(item => addText(`• ${item}`, 10, 'normal', margin + 4));
  yPos += 5;
  
  const steps = [
      { title: 'Preparação', steps: report.cuttingPlan.preparationSteps },
      { title: 'Passo a Passo do Corte', steps: report.cuttingPlan.steps },
      { title: 'Finalização', steps: report.cuttingPlan.finishingSteps },
  ];
  steps.forEach(cat => {
      addText(cat.title, 12, 'bold', margin);
      cat.steps.forEach((step, i) => addText(`${i + 1}. ${step}`, 10, 'normal', margin + 4));
      yPos += 5;
  });

  // --- DIAGRAMS ---
  if (report.cuttingPlan.diagrams && report.cuttingPlan.diagrams.length > 0) {
    addSectionTitle('Diagramas da Técnica');
    const diagramContainer = document.createElement('div');
    diagramContainer.style.position = 'absolute';
    diagramContainer.style.left = '-9999px';
    diagramContainer.style.top = '-9999px';
    document.body.appendChild(diagramContainer);

    for (const diagram of report.cuttingPlan.diagrams) {
        const svgDiv = document.createElement('div');
        svgDiv.style.width = '250px';
        svgDiv.style.height = '250px';
        svgDiv.style.backgroundColor = 'white';
        svgDiv.style.padding = '10px';
        svgDiv.innerHTML = diagram.svg;
        diagramContainer.appendChild(svgDiv);
        
        const canvas = await html2canvas(svgDiv, { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        diagramContainer.removeChild(svgDiv);

        const diagramHeight = 70;
        const diagramWidth = (canvas.width * diagramHeight) / canvas.height;
        
        checkPageBreak(diagramHeight + 15);
        addText(diagram.title, 11, 'bold', margin);
        doc.addImage(imgData, 'PNG', margin, yPos, diagramWidth, diagramHeight);
        yPos += diagramHeight + 8;
    }
    document.body.removeChild(diagramContainer);
  }

  // --- SAVE ---
  doc.save(`plano-de-corte-${report.cuttingPlan.styleName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}