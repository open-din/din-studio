export type DeviceControlKind = 'cc' | 'note';

export type DeviceProfileLayout = 'grid' | 'split-grid';

export interface DeviceControl {
    kind: DeviceControlKind;
    channel: number;
    cc?: number;
    note?: number;
    label: string;
    group: string;
    defaultNodeType: 'midiCC' | 'midiNote';
}

export interface DeviceProfile {
    id: string;
    name: string;
    manufacturer: string;
    layout: DeviceProfileLayout;
    columns?: number;
    controls: DeviceControl[];
}
