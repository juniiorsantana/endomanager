
"use client";

import { useState, useRef, MouseEvent } from 'react';
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';

export type MarkerBase = {
  id: number;
  type: 'critical' | 'attention';
  note: string;
};

export type RectMarker = MarkerBase & {
  shape: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleMarker = MarkerBase & {
  shape: 'circle';
  cx: number;
  cy: number;
  r: number;
};

export type Marker = RectMarker | CircleMarker;

export type InspectionData = {
    generalObservations: string;
    markers: Marker[];
}

interface ImageInspectionCanvasProps {
    value?: Partial<InspectionData>;
    onChange?: (value: Partial<InspectionData>) => void;
    readOnly?: boolean;
}


const markerColors = {
  critical: "fill-red-500/50 stroke-red-700",
  attention: "fill-yellow-400/50 stroke-yellow-600",
}

export default function ImageInspectionCanvas({ value = {}, onChange, readOnly = false }: ImageInspectionCanvasProps) {
  const { markers = [], generalObservations = '' } = value;
  
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Marker> | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [popoverTarget, setPopoverTarget] = useState<string | null>(null);
  
  const svgRectRef = useRef<SVGSVGElement>(null);
  const svgCircleRef = useRef<SVGSVGElement>(null);

  const triggerChange = (newValue: Partial<InspectionData>) => {
    if (onChange) {
        onChange({ ...value, ...newValue });
    }
  }

  const getSVGCoordinates = (e: MouseEvent<SVGSVGElement>): { x: number, y: number } => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transform = svg.getScreenCTM()?.inverse();
    if (!transform) return { x: 0, y: 0 };
    return pt.matrixTransform(transform);
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>, shape: 'rect' | 'circle') => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getSVGCoordinates(e);

    if (shape === 'rect') {
      setCurrentDrawing({ shape, x, y, width: 0, height: 0, type: 'attention', note: '' });
    } else {
      setCurrentDrawing({ shape, cx: x, cy: y, r: 0, type: 'attention', note: '' });
    }
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (readOnly || !isDrawing || !currentDrawing) return;
    const { x, y } = getSVGCoordinates(e);

    if (currentDrawing.shape === 'rect' && currentDrawing.x !== undefined && currentDrawing.y !== undefined) {
      setCurrentDrawing({
        ...currentDrawing,
        width: Math.abs(x - currentDrawing.x),
        height: Math.abs(y - currentDrawing.y),
        x: Math.min(x, currentDrawing.x),
        y: Math.min(y, currentDrawing.y),
      });
    } else if (currentDrawing.shape === 'circle' && currentDrawing.cx !== undefined && currentDrawing.cy !== undefined) {
       const r = Math.sqrt(Math.pow(x - currentDrawing.cx, 2) + Math.pow(y - currentDrawing.cy, 2));
       setCurrentDrawing({
        ...currentDrawing,
        r,
       });
    }
  };

  const handleMouseUp = (e: MouseEvent<SVGSVGElement>) => {
    if (readOnly || !isDrawing || !currentDrawing) return;
    setIsDrawing(false);
    
    if ((currentDrawing.shape === 'rect' && (currentDrawing.width || 0) > 2 && (currentDrawing.height || 0) > 2) || 
        (currentDrawing.shape === 'circle' && (currentDrawing.r || 0) > 2)) {
      setPopoverTarget(currentDrawing.shape!);
    } else {
      setCurrentDrawing(null); 
    }
  };

  const handleSaveMarker = () => {
    if (!currentDrawing) return;
    const newMarker = {
      ...currentDrawing,
      id: Date.now(),
      note: currentDrawing.note || '',
      type: currentDrawing.type || 'attention',
    } as Marker;

    triggerChange({ markers: [...markers, newMarker] });
    setCurrentDrawing(null);
    setPopoverTarget(null);
  };

  const handleCancelMarker = () => {
    setCurrentDrawing(null);
    setPopoverTarget(null);
  }

  const renderMarker = (marker: Marker) => {
    if (marker.shape === 'rect') {
      return <rect key={marker.id} x={marker.x} y={marker.y} width={marker.width} height={marker.height} className={cn(markerColors[marker.type], 'stroke-2')} />
    }
    if (marker.shape === 'circle') {
      return <circle key={marker.id} cx={marker.cx} cy={marker.cy} r={marker.r} className={cn(markerColors[marker.type], 'stroke-2')} />
    }
    return null;
  }

  const PopoverContentBody = (
    <div className="grid gap-4">
      <div className="space-y-2">
          <h4 className="font-medium leading-none">Adicionar Marcação</h4>
          <p className="text-sm text-muted-foreground">
          Selecione o tipo e adicione uma nota.
          </p>
      </div>
      <div className="grid gap-2">
          <Label>Criticidade</Label>
          <RadioGroup 
            value={currentDrawing?.type || 'attention'} 
            onValueChange={(value: 'critical' | 'attention') => setCurrentDrawing(prev => prev ? {...prev, type: value} : null)}
          >
              <div className='flex items-center space-x-2'>
                  <RadioGroupItem value="attention" id={`attention-${currentDrawing?.shape}`}/>
                  <Label htmlFor={`attention-${currentDrawing?.shape}`}>Atenção</Label>
              </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value="critical" id={`critical-${currentDrawing?.shape}`}/>
                  <Label htmlFor={`critical-${currentDrawing?.shape}`}>Crítico</Label>
              </div>
          </RadioGroup>
          <Label htmlFor={`note-${currentDrawing?.shape}`}>Nota</Label>
          <Input 
            id={`note-${currentDrawing?.shape}`} 
            placeholder='Ex: "Mancha escura"'
            value={currentDrawing?.note || ''} 
            onChange={(e) => setCurrentDrawing(prev => prev ? {...prev, note: e.target.value} : null)}
          />
      </div>
      <div className='flex gap-2'>
        <Button variant="outline" onClick={handleCancelMarker}>Cancelar</Button>
        <Button onClick={handleSaveMarker}>Salvar</Button>
      </div>
    </div>
  );

  return (
    <div className='space-y-4'>
        <div className="space-y-2">
            <Label htmlFor="general-observations">Observações Gerais da Imagem</Label>
            <Textarea 
                id="general-observations" 
                placeholder="Descreva falhas de imagem, manchas, iluminação fraca, etc." 
                value={generalObservations}
                onChange={(e) => triggerChange({ generalObservations: e.target.value })}
                readOnly={readOnly}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className='relative flex flex-col items-center'>
                <h4 className='text-center font-medium mb-2'>Área da Imagem (Retangular)</h4>
                <Popover open={!readOnly && popoverTarget === 'rect'} onOpenChange={(isOpen) => !isOpen && handleCancelMarker()}>
                    <PopoverTrigger asChild>
                      <svg 
                        ref={svgRectRef}
                        viewBox="0 0 200 200" 
                        className={cn("w-full max-w-[250px] aspect-square border-2 border-dashed rounded-md", !readOnly && "cursor-crosshair")} 
                        onMouseDown={(e) => handleMouseDown(e, 'rect')}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={() => { if(isDrawing) { setIsDrawing(false); setCurrentDrawing(null); }}}
                      >
                            <rect width="200" height="200" fill="hsl(var(--muted))" className='pointer-events-none' />
                            {markers.filter(m => m.shape === 'rect').map(renderMarker)}
                            {!readOnly && currentDrawing && currentDrawing.shape === 'rect' && isDrawing && renderMarker(currentDrawing as Marker)}
                        </svg>
                    </PopoverTrigger>
                    {!readOnly && (
                        <PopoverContent className="w-80" side='bottom' align='center'>
                            {PopoverContentBody}
                        </PopoverContent>
                    )}
                </Popover>
            </div>
            <div className='relative flex flex-col items-center'>
                <h4 className='text-center font-medium mb-2'>Área da Lente (Circular)</h4>
                <Popover open={!readOnly && popoverTarget === 'circle'} onOpenChange={(isOpen) => !isOpen && handleCancelMarker()}>
                    <PopoverTrigger asChild>
                        <svg 
                          ref={svgCircleRef}
                          viewBox="0 0 200 200" 
                          className={cn("w-full max-w-[250px] aspect-square border-2 border-dashed rounded-full", !readOnly && "cursor-crosshair")}
                          onMouseDown={(e) => handleMouseDown(e, 'circle')}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={() => { if(isDrawing) { setIsDrawing(false); setCurrentDrawing(null); }}}
                        >
                            <circle cx="100" cy="100" r="100" fill="hsl(var(--muted))" className='pointer-events-none' />
                            {markers.filter(m => m.shape === 'circle').map(renderMarker)}
                            {!readOnly && currentDrawing && currentDrawing.shape === 'circle' && isDrawing && renderMarker(currentDrawing as Marker)}
                        </svg>
                    </PopoverTrigger>
                     {!readOnly && (
                        <PopoverContent className="w-80" side='bottom' align='center'>
                            {PopoverContentBody}
                        </PopoverContent>
                     )}
                </Popover>
            </div>
        </div>
        <div className='space-y-2'>
            <Label>Marcações Salvas</Label>
            <div className='p-2 border rounded-md min-h-[50px] bg-background text-sm space-y-1'>
                {markers.length === 0 && <p className='text-muted-foreground'>Nenhuma marcação adicionada.</p>}
                {markers.map(m => (
                    <div key={m.id} className='flex items-center gap-2'>
                        <span className={cn('w-2 h-2 rounded-full', m.type === 'critical' ? 'bg-red-500' : 'bg-yellow-400')}></span>
                        <span>Área: {m.shape === 'rect' ? 'Imagem' : 'Lente'} | Nota: {m.note || 'N/A'}</span>
                         {!readOnly && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto px-1 py-0 text-destructive hover:bg-destructive/10"
                                onClick={() => triggerChange({ markers: markers.filter(marker => marker.id !== m.id) })}
                            >
                                (remover)
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  )
}

    