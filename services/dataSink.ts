
// services/dataSink.ts
import { appEventBus } from '../lib/eventBus';
import { audioService } from './audioService';

/**
 * Unified DataSink for high-volume data egress.
 * Aggregates results from Shunt and Foundry for bulk export.
 */
class DataSink {
  private buffer: any[] = [];
  private readonly MAX_BUFFER_SIZE = 50;

  /**
   * Ingests a data packet into the egress buffer.
   */
  public ingest(payload: any, origin: string) {
    const packet = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      origin,
      data: payload
    };

    this.buffer.push(packet);
    
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }

    appEventBus.emit('telemetry', {
      type: 'data_egress_ingestion',
      data: { packetId: packet.id, origin, bufferSize: this.buffer.length }
    });
  }

  /**
   * Exports the current buffer as a JSON blob.
   */
  public async exportBulk(): Promise<void> {
    if (this.buffer.length === 0) return;

    audioService.playSound('click');
    const blob = new Blob([JSON.stringify(this.buffer, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aether_Bulk_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    audioService.playSound('success');
    this.buffer = []; // Flush on successful export
  }

  public getBufferSize() {
    return this.buffer.length;
  }
}

export const dataSink = new DataSink();
