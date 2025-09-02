import React from 'react';

export function ExportControls({ pattern, currentRound }) {
  
  // Export to JSON
  const exportToJSON = () => {
    if (!pattern || pattern.length === 0) {
      alert('No pattern to export! Add some rounds first.');
      return;
    }
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRounds: pattern.length,
        totalStitches: pattern.reduce((sum, r) => sum + r.stitches, 0),
        currentProgress: currentRound,
        version: '1.0'
      },
      pattern: pattern,
      summary: {
        startStitches: pattern[0]?.stitches || 0,
        endStitches: pattern[pattern.length - 1]?.stitches || 0,
        hasIncreases: pattern.some(r => r.hasIncrease),
        hasDecreases: pattern.some(r => r.hasDecrease)
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `crochet-pattern-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Export to PDF (using browser print)
  const exportToPDF = () => {
    if (!pattern || pattern.length === 0) {
      alert('No pattern to export! Add some rounds first.');
      return;
    }
    
    // Create a new window with printable content
    const printWindow = window.open('', '', 'width=800,height=600');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Crochet Pattern - ${new Date().toLocaleDateString()}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: 'Georgia', serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #333;
          }
          h1 {
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 {
            color: #764ba2;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          .metadata {
            background: #f7f7f7;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .metadata-item {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
          }
          .round {
            margin: 15px 0;
            padding: 12px;
            background: white;
            border-left: 4px solid #fbbf24;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .round-number {
            font-weight: bold;
            color: #764ba2;
            margin-bottom: 5px;
          }
          .round-instruction {
            font-size: 16px;
            line-height: 1.5;
          }
          .round-details {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .summary {
            margin-top: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
          }
          .notes-section {
            margin-top: 40px;
            padding: 20px;
            border: 2px dashed #ccc;
            border-radius: 8px;
          }
          .notes-title {
            color: #666;
            margin-bottom: 10px;
          }
          .notes-lines {
            border-bottom: 1px solid #e0e0e0;
            height: 25px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          @page {
            margin: 0.5in;
          }
        </style>
      </head>
      <body>
        <h1>🧶 Crochet Pattern</h1>
        
        <div class="metadata">
          <div class="metadata-item">
            <span><strong>Date Created:</strong></span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="metadata-item">
            <span><strong>Total Rounds:</strong></span>
            <span>${pattern.length}</span>
          </div>
          <div class="metadata-item">
            <span><strong>Total Stitches:</strong></span>
            <span>${pattern.reduce((sum, r) => sum + r.stitches, 0)}</span>
          </div>
          <div class="metadata-item">
            <span><strong>Starting Stitches:</strong></span>
            <span>${pattern[0]?.stitches || 0}</span>
          </div>
          <div class="metadata-item">
            <span><strong>Ending Stitches:</strong></span>
            <span>${pattern[pattern.length - 1]?.stitches || 0}</span>
          </div>
        </div>
        
        <h2>Pattern Instructions</h2>
        ${pattern.map((round, idx) => `
          <div class="round">
            <div class="round-number">Round ${round.round || (idx + 1)}</div>
            <div class="round-instruction">${round.instruction}</div>
            <div class="round-details">
              Stitches: ${round.stitches}
              ${round.hasIncrease ? ' • Contains increases' : ''}
              ${round.hasDecrease ? ' • Contains decreases' : ''}
            </div>
          </div>
        `).join('')}
        
        <div class="summary">
          <h2 style="color: white; margin-top: 0;">Summary</h2>
          <p>This pattern starts with ${pattern[0]?.stitches || 0} stitches and ends with ${pattern[pattern.length - 1]?.stitches || 0} stitches over ${pattern.length} rounds.</p>
          ${pattern.some(r => r.hasIncrease) ? '<p>• Pattern includes increase rounds</p>' : ''}
          ${pattern.some(r => r.hasDecrease) ? '<p>• Pattern includes decrease rounds</p>' : ''}
        </div>
        
        <div class="notes-section">
          <div class="notes-title">Notes:</div>
          <div class="notes-lines"></div>
          <div class="notes-lines"></div>
          <div class="notes-lines"></div>
          <div class="notes-lines"></div>
        </div>
        
        <div class="footer">
          <p>Generated by Crochet 3D Visualizer • ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          ">
            📄 Print or Save as PDF
          </button>
          <p style="color: #666; margin-top: 15px;">
            Use your browser's print dialog to save as PDF or print this pattern.
          </p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  
  // Export to Text (bonus feature)
  const exportToText = () => {
    if (!pattern || pattern.length === 0) {
      alert('No pattern to export! Add some rounds first.');
      return;
    }
    
    let textContent = 'CROCHET PATTERN\n';
    textContent += '===============\n\n';
    textContent += `Date: ${new Date().toLocaleDateString()}\n`;
    textContent += `Total Rounds: ${pattern.length}\n`;
    textContent += `Total Stitches: ${pattern.reduce((sum, r) => sum + r.stitches, 0)}\n\n`;
    textContent += 'INSTRUCTIONS:\n';
    textContent += '-------------\n';
    
    pattern.forEach((round, idx) => {
      textContent += `Round ${round.round || (idx + 1)}: ${round.instruction}\n`;
      textContent += `  Stitches: ${round.stitches}`;
      if (round.hasIncrease) textContent += ' (increases)';
      if (round.hasDecrease) textContent += ' (decreases)';
      textContent += '\n\n';
    });
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crochet-pattern-${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '20px'
    }}>
      <h2 style={{ 
        fontSize: '18px', 
        margin: '0 0 15px 0', 
        color: '#fbbf24' 
      }}>
        📥 Export Options
      </h2>
      
      <div style={{
        display: 'grid',
        gap: '10px'
      }}>
        <button
          onClick={exportToJSON}
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          💾 Export as JSON
        </button>
        
        <button
          onClick={exportToPDF}
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          📄 Export as PDF
        </button>
        
        <button
          onClick={exportToText}
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          📝 Export as Text
        </button>
      </div>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#fbbf24'
      }}>
        💡 <strong>Tip:</strong> JSON preserves all data for re-import. PDF is best for printing. Text is for simple sharing.
      </div>
    </div>
  );
}