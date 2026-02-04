import * as XLSX from 'xlsx';
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

// Generate Excel template
export function generateExcelTemplate(): Blob {
  const headers = [...SQUAD_IMPORT_COLUMNS, ...ALL_ATTRIBUTE_COLUMNS];
  
  // Create worksheet data
  const wsData = [
    headers,
    ['John', 'Smith', 28, 'England', 'Loosehead Prop', 75, 7, 95, 80, 85, 75, 70, 72, 70],
    ['Mike', 'Johnson', 25, 'Ireland', 'Hooker', 78, 8, 100, '', 75, '', 80, '', 75, 85, 72],
    ['Tom', 'Williams', 30, 'Wales', 'Fly-half', 82, 7, 90],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 15 }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Squad');
  
  // Add instructions sheet
  const instructionsData = [
    ['Squad Import Instructions'],
    [''],
    ['Required Columns:'],
    ['firstName', 'Player first name'],
    ['lastName', 'Player last name'],
    ['age', 'Player age (17-45)'],
    ['nationality', 'Player nationality'],
    ['position', 'Player position (see valid positions below)'],
    [''],
    ['Optional Columns:'],
    ['overall', 'Overall rating (1-100, default 65)'],
    ['form', 'Current form (1-10, default 7)'],
    ['fitness', 'Current fitness (0-100, default 100)'],
    [''],
    ['Valid Positions:'],
    ...VALID_POSITIONS.map(p => [p]),
    [''],
    ['Note: Empty attribute cells will be auto-generated with values 60-80'],
  ];
  
  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Download template file
export function downloadTemplate(format: 'csv' | 'xlsx'): void {
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
    const blob = generateExcelTemplate();
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

// Parse and validate imported file
export function parseImportFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: unknown[][] = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string;
          const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
          rows = lines.map(line => {
            // Handle quoted values
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (const char of line) {
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            return values;
          });
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
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
