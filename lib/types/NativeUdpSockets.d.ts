import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
export interface Spec extends TurboModule {
    createSocket(id: number, options: {
        type: string;
    }): void;
    bind(id: number, port: number, address: string | null, options: {
        reusePort: boolean;
    } | null, callback: () => void): void;
    addMembership(id: number, multicastAddress: string): void;
    dropMembership(id: number, multicastAddress: string): void;
    send(id: number, base64String: string, port: number, address: string, callback: () => void): void;
    close(id: number, callback: () => void): void;
    setBroadcast(id: number, flag: boolean, callback: () => void): void;
}
declare const _default: Spec;
export default _default;
