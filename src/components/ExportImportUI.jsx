// src/components/ExportImportUI.jsx
// Visual export/import interface component

import React, { useState, useRef } from 'react';

export function ExportImportUI({
  manager,
  assembly,
  onImportComplete,
  onExportComplete,
  additionalData = {}
}) {
  const [activeTab, setActiveTab] = useState('export');
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [exportOptions, setExportOptions] = useState({
    includeHistory: true,
    includeValidation: true,
    includeSuggestions: false,
    compress: true
  });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  
  const formatInfo = {
    json: {
      icon: '📄',
      description: 'Complete project with all data, perfect for backups',
      features: ['All pieces and connections', 'History and settings', 'Compressed format']
    },
    pattern: {
      icon: '🧶',
      description: 'Human-readable crochet instructions',
      features: ['Step-by-step instructions', 'Materials list', 'Printable format']
    },
    svg: {
      icon: '🎨',
      description: '2D vector diagram for documentation',
      features: ['Visual representation', 'Scalable graphics', 'Print-ready']
    },
    pdf: {
      icon: '📑',
      description: 'Professional pattern document',
      features: ['Complete instructions', 'Diagrams included', 'Ready to share']
    },
    obj: {
      icon: '🎲',
      description: '3D model for viewing or printing',
      features: ['3D geometry', 'Compatible with 3D software', 'Printable']
    },
    csv: {
      icon: '📊',
      description: 'Spreadsheet data for analysis',
      features: ['Piece data', 'Position information', 'Excel compatible']
    },
    backup: {
      icon: '💾',
      description: 'Complete backup with full history',
      features: ['Everything included', 'Compressed', 'Version safe']
    }
  };
  
  const handleExport = async () => {
    if (!manager || !assembly) {
      setError('Export manager not available');
      return;
    }
    
    setExporting(true);
    setError(null);
    
    try {
      // Prepare data
      const exportData = {
        ...additionalData,
        includeHistory: exportOptions.includeHistory,
        includeValidation: exportOptions.includeValidation,
        includeSuggestions: exportOptions.includeSuggestions
      };
      
      // Export
      const result = await manager.export(assembly, selectedFormat, exportData);
      
      // Download file
      manager.download(result.content, result.filename, result.mimeType);
      
      setExportResult({
        format: selectedFormat,
        filename: result.filename,
        size: result.content.length,
        timestamp: new Date()
      });
      
      onExportComplete?.({
        format: selectedFormat,
        filename: result.filename
      });
      
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };
  
  const handleImport = async (file) => {
    if (!manager || !file) return;
    
    setImporting(true);
    setError(null);
    
    try {
      // Import file
      const result = await manager.import(file, 'auto');
      
      setImportResult({
        filename: file.name,
        pieces: result.assembly.pieces.size,
        connections: result.assembly.connections.size,
        hasHistory: !!result.history,
        timestamp: new Date()
      });
      
      onImportComplete?.(result);
      
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImport(file);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImport(file);
    }
  };
  
  const renderExportTab = () => (
    <div style={{ padding: '20px' }}>
      {/* Format Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Select Export Format
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {Object.entries(formatInfo).map(([format, info]) => (
            <div
              key={format}
              onClick={() => setSelectedFormat(format)}
              style={{
                padding: '12px',
                border: selectedFormat === format ? '2px solid #2196F3' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedFormat === format ? '#E3F2FD' : 'white',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                {info.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {format.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Format Details */}
      {selectedFormat && (
        <div style={{
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            {formatInfo[selectedFormat].icon} {selectedFormat.toUpperCase()} Format
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
            {formatInfo[selectedFormat].description}
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
            {formatInfo[selectedFormat].features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Export Options */}
      {(selectedFormat === 'json' || selectedFormat === 'backup') && (
        <div style={{
          padding: '15px',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
            Export Options
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeHistory}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  includeHistory: e.target.checked
                })}
              />
              Include undo/redo history
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeValidation}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  includeValidation: e.target.checked
                })}
              />
              Include validation data
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeSuggestions}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  includeSuggestions: e.target.checked
                })}
              />
              Include AI suggestions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={exportOptions.compress}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  compress: e.target.checked
                })}
              />
              Compress file
            </label>
          </div>
        </div>
      )}
      
      {/* Assembly Info */}
      <div style={{
        padding: '10px',
        background: '#f9f9f9',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Current Assembly:</strong> {assembly?.name || 'Untitled'}<br />
        <strong>Pieces:</strong> {assembly?.pieces?.size || 0} | 
        <strong> Connections:</strong> {assembly?.connections?.size || 0}
      </div>
      
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exporting || !assembly}
        style={{
          width: '100%',
          padding: '12px',
          background: exporting ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: exporting ? 'not-allowed' : 'pointer'
        }}
      >
        {exporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
      </button>
      
      {/* Export Result */}
      {exportResult && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: '#E8F5E9',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          ✅ Exported successfully<br />
          <strong>File:</strong> {exportResult.filename}<br />
          <strong>Size:</strong> {(exportResult.size / 1024).toFixed(2)} KB
        </div>
      )}
    </div>
  );
  
  const renderImportTab = () => (
    <div style={{ padding: '20px' }}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '40px',
          border: '2px dashed #2196F3',
          borderRadius: '12px',
          textAlign: 'center',
          background: importing ? '#f5f5f5' : '#F3F8FF',
          cursor: importing ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
          {importing ? '⏳' : '📁'}
        </div>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          {importing ? 'Importing...' : 'Drop file here or click to browse'}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
          Supported formats: .c3d, .json, .pattern, .csv, .c3d-backup
        </p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".c3d,.json,.pattern,.txt,.csv,.c3d-backup"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {/* Import Result */}
      {importResult && (
        <div style={{
          padding: '15px',
          background: '#E8F5E9',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            ✅ Import Successful
          </h4>
          <div style={{ fontSize: '13px' }}>
            <strong>File:</strong> {importResult.filename}<br />
            <strong>Pieces:</strong> {importResult.pieces}<br />
            <strong>Connections:</strong> {importResult.connections}<br />
            {importResult.hasHistory && <span>✓ History included<br /></span>}
            <strong>Imported:</strong> {importResult.timestamp.toLocaleTimeString()}
          </div>
        </div>
      )}
      
      {/* Import Info */}
      <div style={{
        padding: '15px',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          Import Information
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
          <li>JSON/C3D files include complete project data</li>
          <li>Pattern files import as editable pieces</li>
          <li>CSV files import piece data and positions</li>
          <li>Backup files restore everything including history</li>
          <li>All imports are validated for compatibility</li>
        </ul>
      </div>
    </div>
  );
  
  return (
    <div style={{
      width: '500px',
      maxWidth: '90vw',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>💾</span>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          Export / Import
        </span>
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd'
      }}>
        <button
          onClick={() => setActiveTab('export')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'export' ? 'white' : '#f5f5f5',
            border: 'none',
            borderBottom: activeTab === 'export' ? '2px solid #2196F3' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'export' ? 'bold' : 'normal'
          }}
        >
          📤 Export
        </button>
        <button
          onClick={() => setActiveTab('import')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'import' ? 'white' : '#f5f5f5',
            border: 'none',
            borderBottom: activeTab === 'import' ? '2px solid #2196F3' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'import' ? 'bold' : 'normal'
          }}
        >
          📥 Import
        </button>
      </div>
      
      {/* Content */}
      {activeTab === 'export' ? renderExportTab() : renderImportTab()}
      
      {/* Error Display */}
      {error && (
        <div style={{
          margin: '15px',
          padding: '12px',
          background: '#FFEBEE',
          borderRadius: '6px',
          color: '#C62828',
          fontSize: '13px'
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
