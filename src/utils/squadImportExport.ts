import ExcelJS from 'exceljs';
import { Player, Position, PositionNumber, POSITION_MAP, PositionAttributes } from '@/types/game';

// Column headers for the import template
export const SQUAD_IMPORT_COLUMNS = [
  'firstName',
  'lastName',
  'age',
  'nationality',
  'position',
  'overall',
  'form',
  'fitness'
];

// Position-specific attribute columns
export const POSITION_ATTRIBUTE_COLUMNS: Record<string, string[]> = {
  'Loosehead Prop': ['scrummaging', 'strength', 'endurance', 'lineoutLifting', 'ballCarrying', 'tackling'],
  'Hooker': ['throwing', 'scrummaging', 'strength', 'workRate', 'tackling', 'ballCarrying'],
  'Tighthead Prop': ['scrummaging', 'strength', 'endurance', 'lineoutLifting', 'ballCarrying', 'tackling'],
  'Lock': ['lineout', 'strength', 'workRate', 'tackling', 'ballCarrying', 'aerialAbility'],
  'Blindside Flanker': ['tackling', 'workRate', 'ballCarrying', 'breakdown', 'speed', 'handling'],
  'Openside Flanker': ['tackling', 'workRate', 'ballCarrying', 'breakdown', 'speed', 'handling'],
  'Number 8': ['ballCarrying', 'strength', 'tackling', 'breakdown', 'handling', 'vision'],
  'Scrum-half': ['passing', 'kicking', 'speed', 'decisionMaking', 'boxKicking', 'sniping'],
  'Fly-half': ['kicking', 'passing', 'decisionMaking', 'gameManagement', 'tackling', 'running'],
  'Inside Centre': ['speed', 'strength', 'tackling', 'passing', 'handling', 'defensiveReading'],
  'Outside Centre': ['speed', 'strength', 'tackling', 'passing', 'handling', 'defensiveReading'],
  'Left Wing': ['speed', 'finishing', 'aerialAbility', 'stepping', 'tackling', 'workRate'],
  'Right Wing': ['speed', 'finishing', 'aerialAbility', 'stepping', 'tackling', 'workRate'],
  'Fullback': ['kicking', 'catching', 'speed', 'positioning', 'counterAttacking', 'tackling']
};

// All unique attribute columns for the template
export const ALL_ATTRIBUTE_COLUMNS = [
  'scrummaging', 'strength', 'endurance', 'lineoutLifting', 'ballCarrying', 'tackling',
  'throwing', 'workRate', 'lineout', 'aerialAbility', 'breakdown', 'speed', 'handling',
  'vision', 'passing', 'kicking', 'decisionMaking', 'boxKicking', 'sniping',
  'gameManagement', 'running', 'defensiveReading', 'finishing', 'stepping',
  'catching', 'positioning', 'counterAttacking'
];

export const VALID_POSITIONS: Position[] = [
  'Loosehead Prop', 'Hooker', 'Tighthead Prop',
  'Lock', 'Blindside Flanker', 'Openside Flanker', 'Number 8',
  'Scrum-half', 'Fly-half', 'Inside Centre', 'Outside Centre',
  'Left Wing', 'Right Wing', 'Fullback'
];

export const POSITION_TO_NUMBER: Record<Position, PositionNumber> = {
  'Loosehead Prop': 1,
  'Hooker': 2,
  'Tighthead Prop': 3,
  'Lock': 4,
  'Blindside Flanker': 6,
  'Openside Flanker': 7,
  'Number 8': 8,
  'Scrum-half': 9,
  'Fly-half': 10,
  'Left Wing': 11,
  'Inside Centre': 12,
  'Outside Centre': 13,
  'Right Wing': 14,
  'Fullback': 15
};

// Generate a downloadable CSV template
export function generateSquadTemplate(): string {
  const headers = [...SQUAD_IMPORT_COLUMNS, ...ALL_ATTRIBUTE_COLUMNS];
  
  // Example rows for each position
  const exampleRows = [
    ['John', 'Smith', 28, 'England', 'Loosehead Prop', 75, 7, 95, 80, 85, 75, 70, 72, 70, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Mike', 'Johnson', 25, 'Ireland', 'Hooker', 78, 8, 100, '', 75, '', 80, '', 75, 85, 72, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Tom', 'Williams', 30, 'Wales', 'Fly-half', 82, 7, 90, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 85, 80, 78, 82, 65, 75, '', '', '', ''],
  ];
  
  const rows = [headers.join(',')];
  exampleRows.forEach(row => {
    rows.push(row.join(','));
  });
  
  // Add instructions as comments
  const instructions = `# Squad Import Template
# 
# Required columns: firstName, lastName, age, nationality, position
# Optional columns: overall (default 65), form (default 7), fitness (default 100)
# 
# Valid positions: ${VALID_POSITIONS.join(', ')}
#
# Attributes are position-specific. Only fill in attributes relevant to each position:
# - Props: scrummaging, strength, endurance, lineoutLifting, ballCarrying, tackling
# - Hooker: throwing, scrummaging, strength, workRate, tackling, ballCarrying
# - Lock: lineout, strength, workRate, tackling, ballCarrying, aerialAbility
# - Flankers: tackling, workRate, ballCarrying, breakdown, speed, handling
# - Number 8: ballCarrying, strength, tackling, breakdown, handling, vision
# - Scrum-half: passing, kicking, speed, decisionMaking, boxKicking, sniping
# - Fly-half: kicking, passing, decisionMaking, gameManagement, tackling, running
# - Centres: speed, strength, tackling, passing, handling, defensiveReading
# - Wings: speed, finishing, aerialAbility, stepping, tackling, workRate
# - Fullback: kicking, catching, speed, positioning, counterAttacking, tackling
#
# Empty attribute cells will be auto-generated with random values 60-80
#
`;
  
  return instructions + rows.join('\n');
}

// Generate Excel template using ExcelJS
export async function generateExcelTemplate(): Promise<Blob> {
  const headers = [...SQUAD_IMPORT_COLUMNS, ...ALL_ATTRIBUTE_COLUMNS];
  
  const workbook = new ExcelJS.Workbook();
  
  // Create Squad sheet
  const squadSheet = workbook.addWorksheet('Squad');
  
  // Add headers
  squadSheet.addRow(headers);
  
  // Add example data rows
  squadSheet.addRow(['John', 'Smith', 28, 'England', 'Loosehead Prop', 75, 7, 95, 80, 85, 75, 70, 72, 70]);
  squadSheet.addRow(['Mike', 'Johnson', 25, 'Ireland', 'Hooker', 78, 8, 100, '', 75, '', 80, '', 75, 85, 72]);
  squadSheet.addRow(['Tom', 'Williams', 30, 'Wales', 'Fly-half', 82, 7, 90]);
  
  // Set column widths
  squadSheet.columns = headers.map(() => ({ width: 15 }));
  
  // Create Instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  
  instructionsSheet.addRow(['Squad Import Instructions']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['Required Columns:']);
  instructionsSheet.addRow(['firstName', 'Player first name']);
  instructionsSheet.addRow(['lastName', 'Player last name']);
  instructionsSheet.addRow(['age', 'Player age (17-45)']);
  instructionsSheet.addRow(['nationality', 'Player nationality']);
  instructionsSheet.addRow(['position', 'Player position (see valid positions below)']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['Optional Columns:']);
  instructionsSheet.addRow(['overall', 'Overall rating (1-100, default 65)']);
  instructionsSheet.addRow(['form', 'Current form (1-10, default 7)']);
  instructionsSheet.addRow(['fitness', 'Current fitness (0-100, default 100)']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['Valid Positions:']);
  VALID_POSITIONS.forEach(p => instructionsSheet.addRow([p]));
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['Note: Empty attribute cells will be auto-generated with values 60-80']);
  
  // Set column widths for instructions
  instructionsSheet.columns = [{ width: 20 }, { width: 50 }];
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Export current squad to CSV
export function exportSquadToCSV(players: Player[]): void {
  const headers = [...SQUAD_IMPORT_COLUMNS, ...ALL_ATTRIBUTE_COLUMNS];
  const rows = [headers.join(',')];

  for (const player of players) {
    const attrs = player.attributes as unknown as Record<string, number>;
    const row = [
      `"${player.firstName}"`,
      `"${player.lastName}"`,
      player.age,
      `"${player.nationality}"`,
      `"${player.position}"`,
      player.overall,
      player.form,
      player.fitness,
      ...ALL_ATTRIBUTE_COLUMNS.map(col => attrs[col] ?? '')
    ];
    rows.push(row.join(','));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'squad_export.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// Download template file
export async function downloadTemplate(format: 'csv' | 'xlsx'): Promise<void> {
  if (format === 'csv') {
    const content = generateSquadTemplate();
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'squad_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const blob = await generateExcelTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'squad_import_template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }
}

export interface ImportValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ImportResult {
  players: Player[];
  errors: ImportValidationError[];
  warnings: string[];
}

// Maximum file size for import (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Parse and validate imported file
export function parseImportFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    // Validate file size to prevent ReDoS and memory issues
    if (file.size > MAX_FILE_SIZE) {
      resolve({ 
        players: [], 
        errors: [{ row: 0, column: '', message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` }], 
        warnings: [] 
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let rows: unknown[][] = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV with safe parsing (no regex that could cause ReDoS)
          const text = data as string;
          rows = parseCSVSafe(text);
        } else {
          // Parse Excel using ExcelJS
          const workbook = new ExcelJS.Workbook();
          const buffer = data as ArrayBuffer;
          await workbook.xlsx.load(buffer);
          
          const worksheet = workbook.worksheets[0];
          if (worksheet) {
            worksheet.eachRow((row, rowNumber) => {
              const rowValues: unknown[] = [];
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                // Pad array with empty strings for missing columns
                while (rowValues.length < colNumber - 1) {
                  rowValues.push('');
                }
                rowValues.push(cell.value ?? '');
              });
              rows.push(rowValues);
            });
          }
        }
        
        if (rows.length < 2) {
          resolve({ players: [], errors: [{ row: 0, column: '', message: 'File is empty or has no data rows' }], warnings: [] });
          return;
        }
        
        const headers = (rows[0] as string[]).map(h => String(h).trim().toLowerCase());
        const dataRows = rows.slice(1);
        
        const result = validateAndParseRows(headers, dataRows);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

// Safe CSV parser that avoids ReDoS vulnerabilities
function parseCSVSafe(text: string): unknown[][] {
  const rows: unknown[][] = [];
  const lines: string[] = [];
  
  // Split by newlines safely (no complex regex)
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim() && !currentLine.startsWith('#')) {
        lines.push(currentLine);
      }
      currentLine = '';
      // Handle \r\n
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  
  // Don't forget the last line
  if (currentLine.trim() && !currentLine.startsWith('#')) {
    lines.push(currentLine);
  }
  
  // Parse each line
  for (const line of lines) {
    const values: string[] = [];
    let current = '';
    let quoted = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Check for escaped quote
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    rows.push(values);
  }
  
  return rows;
}

function validateAndParseRows(headers: string[], dataRows: unknown[][]): ImportResult {
  const players: Player[] = [];
  const errors: ImportValidationError[] = [];
  const warnings: string[] = [];
  
  // Map headers to column indices
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    colIndex[h] = i;
  });
  
  // Check required columns
  const requiredCols = ['firstname', 'lastname', 'age', 'nationality', 'position'];
  for (const col of requiredCols) {
    if (colIndex[col] === undefined) {
      errors.push({ row: 0, column: col, message: `Missing required column: ${col}` });
    }
  }
  
  if (errors.length > 0) {
    return { players, errors, warnings };
  }
  
  dataRows.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2; // Account for header row
    
    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      return;
    }
    
    const getValue = (col: string): string => {
      const idx = colIndex[col];
      return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
    };
    
    const getNumValue = (col: string, defaultVal: number): number => {
      const val = getValue(col);
      if (!val) return defaultVal;
      const num = parseInt(val, 10);
      return isNaN(num) ? defaultVal : num;
    };
    
    // Validate required fields
    const firstName = getValue('firstname');
    const lastName = getValue('lastname');
    const age = getNumValue('age', 0);
    const nationality = getValue('nationality');
    const positionStr = getValue('position');
    
    if (!firstName) {
      errors.push({ row: rowNum, column: 'firstName', message: 'First name is required' });
    }
    if (!lastName) {
      errors.push({ row: rowNum, column: 'lastName', message: 'Last name is required' });
    }
    if (age < 17 || age > 45) {
      errors.push({ row: rowNum, column: 'age', message: 'Age must be between 17 and 45' });
    }
    if (!nationality) {
      errors.push({ row: rowNum, column: 'nationality', message: 'Nationality is required' });
    }
    
    // Validate position
    const position = VALID_POSITIONS.find(p => p.toLowerCase() === positionStr.toLowerCase());
    if (!position) {
      errors.push({ row: rowNum, column: 'position', message: `Invalid position: ${positionStr}. Valid: ${VALID_POSITIONS.join(', ')}` });
      return;
    }
    
    // Get optional values
    const overall = Math.min(100, Math.max(1, getNumValue('overall', 65)));
    const form = Math.min(10, Math.max(1, getNumValue('form', 7)));
    const fitness = Math.min(100, Math.max(0, getNumValue('fitness', 100)));
    
    // Build attributes for this position
    const positionAttributes = POSITION_ATTRIBUTE_COLUMNS[position];
    const attributes: Record<string, number> = {};
    
    positionAttributes.forEach(attr => {
      const val = getNumValue(attr, 0);
      if (val > 0) {
        attributes[attr] = Math.min(100, Math.max(1, val));
      } else {
        // Generate random value if not provided
        attributes[attr] = Math.floor(Math.random() * 21) + 60; // 60-80
      }
    });
    
    const player: Player = {
      id: `imported_${Date.now()}_${rowIndex}`,
      firstName,
      lastName,
      age,
      nationality,
      position,
      positionNumber: POSITION_TO_NUMBER[position],
      attributes: attributes as unknown as PositionAttributes,
      overall,
      form,
      fitness,
      injured: false,
      injuryWeeks: 0
    };
    
    players.push(player);
  });
  
  if (players.length === 0 && errors.length === 0) {
    warnings.push('No valid player data found in file');
  }
  
  if (players.length > 45) {
    warnings.push(`Found ${players.length} players. Squad limit is 45. Only the first 45 will be imported.`);
  }
  
  return { players: players.slice(0, 45), errors, warnings };
}
