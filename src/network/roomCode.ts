import { ROOM_CODE_LENGTH, PEER_ID_PREFIX } from '../utils/constants';

// Ambiguity-free charset (no O/0/I/1/L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function roomCodeToPeerId(code: string): string {
  return `${PEER_ID_PREFIX}${code.toUpperCase()}`;
}

export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  return [...code.toUpperCase()].every((ch) => CHARSET.includes(ch));
}
