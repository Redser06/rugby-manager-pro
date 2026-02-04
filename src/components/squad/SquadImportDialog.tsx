import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Users
} from 'lucide-react';
import { Player } from '@/types/game';
import { downloadTemplate, parseImportFile, ImportResult, ImportValidationError } from '@/utils/squadImportExport';

interface SquadImportDialogProps {
  onImport: (players: Player[]) => void;
  currentSquadSize: number;
}

export function SquadImportDialog({ onImport, currentSquadSize }: SquadImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const isValid = validTypes.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      setImportResult({
        players: [],
        errors: [{ row: 0, column: '', message: 'Invalid file type. Please use CSV or Excel (.xlsx) files.' }],
        warnings: []
      });
      setStep('preview');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImportResult({
        players: [],
        errors: [{ row: 0, column: '', message: 'File too large. Maximum size is 5MB.' }],
        warnings: []
      });
      setStep('preview');
      return;
    }

    setSelectedFile(file);
    setLoading(true);

    try {
      const result = await parseImportFile(file);
      setImportResult(result);
      setStep('preview');
    } catch (error) {
      setImportResult({
        players: [],
        errors: [{ row: 0, column: '', message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        warnings: []
      });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (importResult && importResult.players.length > 0) {
      onImport(importResult.players);
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('upload');
    setImportResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Download Template Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Step 1: Download Template
          </CardTitle>
          <CardDescription>
            Get the template file with the correct column headers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => downloadTemplate('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate('xlsx')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Step 2: Upload Your Squad
          </CardTitle>
          <CardDescription>
            Fill in the template and upload it here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">CSV or Excel files (max 5MB)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          This will <strong>replace your entire squad</strong> with the imported players. 
          Current squad: {currentSquadSize} players. Make sure to save your game first if you want to keep your current squad.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPreviewStep = () => {
    if (!importResult) return null;

    const hasErrors = importResult.errors.length > 0;
    const hasWarnings = importResult.warnings.length > 0;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{importResult.players.length}</p>
              <p className="text-xs text-muted-foreground">Players Found</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <AlertCircle className={`h-6 w-6 mx-auto mb-1 ${hasErrors ? 'text-destructive' : 'text-muted-foreground'}`} />
              <p className="text-2xl font-bold">{importResult.errors.length}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <AlertTriangle className={`h-6 w-6 mx-auto mb-1 ${hasWarnings ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              <p className="text-2xl font-bold">{importResult.warnings.length}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ScrollArea className="h-24 mt-2">
                <ul className="text-sm space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>
                      {err.row > 0 && <span className="font-medium">Row {err.row}: </span>}
                      {err.column && <span className="font-medium">[{err.column}] </span>}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="text-sm space-y-1 mt-2">
                {importResult.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Table */}
        {importResult.players.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead className="text-center">OVR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.players.map((player, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>{player.age}</TableCell>
                        <TableCell>{player.nationality}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={player.overall >= 80 ? 'default' : 'secondary'}>
                            {player.overall}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Squad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Squad from File
          </DialogTitle>
          <DialogDescription>
            Replace your entire squad with players from a CSV or Excel file
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}

        <DialogFooter className="gap-2">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleConfirmImport}
                disabled={!importResult || importResult.players.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import {importResult?.players.length || 0} Players
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
