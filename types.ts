
// Fix: Added THREE import to resolve namespace errors in ParticleState
import * as THREE from 'three';

export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS'
}

export interface ParticleState {
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Euler;
  speed: number;
}
