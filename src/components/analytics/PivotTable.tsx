import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Expense } from '@/types';
import { format, parseISO, startOfMonth, startOfWeek, getMonth, getYear } from 'date-fns';
import { ArrowUpDown, TableIcon, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type RowDimension = 'category' | 'month' | 'week';
type ColumnDimension = 'category' | 'month' | 'none';
type AggregationType = 'sum' | 'count' | 'average' | 'min' | 'max';

interface PivotTableProps {
  expenses: Expense[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 65%, 60%)',
];

export function PivotTable({ expenses }: PivotTableProps) {
  const { formatAmount } = useCurrency();
  const [rowDimension, setRowDimension] = useState<RowDimension>('category');
  const [columnDimension, setColumnDimension] = useState<ColumnDimension>('month');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Get unique values for each dimension
  const getDimensionValue = (expense: Expense, dimension: RowDimension | ColumnDimension): string => {
    switch (dimension) {
      case 'category':
        return expense.category;
      case 'month':
        const date = parseISO(expense.date);
        return format(startOfMonth(date), 'MMM yyyy');
      case 'week':
        const weekDate = parseISO(expense.date);
        return format(startOfWeek(weekDate), "'Week of' MMM d");
      case 'none':
        return 'Total';
      default:
        return 'Unknown';
    }
  };

  // Build pivot table data
  const pivotData = useMemo(() => {
    // Get unique row and column values
    const rowValues = [...new Set(expenses.map(e => getDimensionValue(e, rowDimension)))].sort();
    const colValues = columnDimension === 'none' 
      ? ['Total'] 
      : [...new Set(expenses.map(e => getDimensionValue(e, columnDimension)))].sort((a, b) => {
          // Sort months chronologically
          if (columnDimension === 'month') {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            const dateA = new Date(`${monthA} 1, ${yearA}`);
            const dateB = new Date(`${monthB} 1, ${yearB}`);
            return dateA.getTime() - dateB.getTime();
          }
          return a.localeCompare(b);
        });

    // Build data matrix
    const matrix: Record<string, Record<string, number[]>> = {};
    
    rowValues.forEach(row => {
      matrix[row] = {};
      colValues.forEach(col => {
        matrix[row][col] = [];
      });
    });

    // Populate matrix with expense amounts
    expenses.forEach(expense => {
      const rowKey = getDimensionValue(expense, rowDimension);
      const colKey = columnDimension === 'none' ? 'Total' : getDimensionValue(expense, columnDimension);
      if (matrix[rowKey] && matrix[rowKey][colKey]) {
        matrix[rowKey][colKey].push(Number(expense.amount));
      }
    });

    // Apply aggregation
    const aggregatedMatrix: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};

    rowValues.forEach(row => {
      aggregatedMatrix[row] = {};
      let rowTotal = 0;
      
      colValues.forEach(col => {
        const values = matrix[row][col];
        let aggregatedValue = 0;
        
        if (values.length > 0) {
          switch (aggregation) {
            case 'sum':
              aggregatedValue = values.reduce((a, b) => a + b, 0);
              break;
            case 'count':
              aggregatedValue = values.length;
              break;
            case 'average':
              aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case 'min':
              aggregatedValue = Math.min(...values);
              break;
            case 'max':
              aggregatedValue = Math.max(...values);
              break;
          }
        }
        
        aggregatedMatrix[row][col] = aggregatedValue;
        rowTotal += aggregatedValue;
        colTotals[col] = (colTotals[col] || 0) + aggregatedValue;
      });
      
      rowTotals[row] = rowTotal;
    });

    // Sort if needed
    let sortedRows = [...rowValues];
    if (sortColumn) {
      sortedRows.sort((a, b) => {
        const valueA = sortColumn === 'total' ? rowTotals[a] : aggregatedMatrix[a][sortColumn] || 0;
        const valueB = sortColumn === 'total' ? rowTotals[b] : aggregatedMatrix[b][sortColumn] || 0;
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }

    return {
      rows: sortedRows,
      columns: colValues,
      data: aggregatedMatrix,
      rowTotals,
      colTotals,
      grandTotal: Object.values(rowTotals).reduce((a, b) => a + b, 0),
    };
  }, [expenses, rowDimension, columnDimension, aggregation, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const formatValue = (value: number) => {
    if (aggregation === 'count') {
      return value.toFixed(0);
    }
    return formatAmount(value);
  };

  // Chart data for visualization
  const chartData = useMemo(() => {
    return pivotData.rows.map((row, index) => ({
      name: row,
      value: pivotData.rowTotals[row],
      color: COLORS[index % COLORS.length],
    }));
  }, [pivotData]);

  if (expenses.length === 0) {
    return (
      <div className="glass-card p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-primary" />
          Pivot Table Analysis
        </h3>
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          No expense data available for analysis
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-primary" />
          Pivot Table Analysis
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dimension Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Rows</label>
          <Select value={rowDimension} onValueChange={(v) => setRowDimension(v as RowDimension)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Columns</label>
          <Select value={columnDimension} onValueChange={(v) => setColumnDimension(v as ColumnDimension)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Totals Only)</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Aggregation</label>
          <Select value={aggregation} onValueChange={(v) => setAggregation(v as AggregationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="count">Count</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="min">Minimum</SelectItem>
              <SelectItem value="max">Maximum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline">
          {pivotData.rows.length} {rowDimension === 'category' ? 'categories' : rowDimension === 'month' ? 'months' : 'weeks'}
        </Badge>
        <Badge variant="outline">
          {expenses.length} transactions
        </Badge>
        <Badge variant="secondary">
          Grand Total: {formatValue(pivotData.grandTotal)}
        </Badge>
      </div>

      {viewMode === 'table' ? (
        /* Pivot Table */
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold capitalize">{rowDimension}</TableHead>
                {pivotData.columns.map(col => (
                  <TableHead 
                    key={col} 
                    className="text-right cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {col}
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableHead>
                ))}
                <TableHead 
                  className="text-right font-semibold cursor-pointer hover:bg-muted/70 bg-muted/30"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Row Total
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.rows.map((row, rowIndex) => (
                <TableRow key={row} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{row}</TableCell>
                  {pivotData.columns.map(col => (
                    <TableCell key={col} className="text-right tabular-nums">
                      {pivotData.data[row][col] > 0 ? formatValue(pivotData.data[row][col]) : '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold tabular-nums bg-muted/20">
                    {formatValue(pivotData.rowTotals[row])}
                  </TableCell>
                </TableRow>
              ))}
              {/* Column Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Column Total</TableCell>
                {pivotData.columns.map(col => (
                  <TableCell key={col} className="text-right tabular-nums">
                    {formatValue(pivotData.colTotals[col])}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums bg-primary/10">
                  {formatValue(pivotData.grandTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Chart View */
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                width={75}
              />
              <Tooltip 
                formatter={(value: number) => formatValue(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
