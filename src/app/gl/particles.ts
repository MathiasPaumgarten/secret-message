import { random } from "lodash";
import { PARTICLE_VERTEX, PARTICLE_FRAGMENT } from "./shaders";
import {
    BufferAttribute,
    BufferGeometry,
    Points,
    ShaderMaterial,
    Texture,
    WebGLRenderer,
} from "three";

import { createTexture, ShaderPass } from "./shader-pass";

// Incomplete list of possible uniform types.
export type UniformValue = number | [ number, number ] | Texture;

export interface ParticlesOptions {
    positionShader: string;
    positionUniforms: { [ key: string ]: any};

    velocityShader: string;
    velocityUniforms: { [ key: string ]: any};

    renderer: WebGLRenderer;
}

function generateRandomPosition( size: number ): number[] {
    const array: number[] = [];

    for ( let y = 0; y < size; y++ ) {
        for ( let x = 0; x < size; x++ ) {
            array.push(
                random( -100, 100, true ),
                random( -100, 100, true ),
                1,
                0,
            );
        }
    }

    return array;
}

export class Particles extends Points {

    private positionPass: ShaderPass;
    private velocityPass: ShaderPass;
    private latest: number;
    private size: number;

    constructor( size: number, options: ParticlesOptions ) {
        const references = new Float32Array( size * size * 2 );

        let i = 0;

        for ( let y = 0; y < size; y++ ) {
            for ( let x = 0; x < size; x++ ) {
                references[ i ] = x / size;
                references[ i + 1 ] = y / size;
                i += 2;
            }
        }

        const positionPass = new ShaderPass( {
            renderer: options.renderer,
            shader: options.positionShader,
            name: "positionTexture",
            size,
            startValue: generateRandomPosition( size ),
            uniforms: {
                ...options.positionUniforms,
                velocityTexture: createTexture( size, size, 0 ),
                delta: 0.016,
            },
        } );

        const velocityPass = new ShaderPass( {
            renderer: options.renderer,
            shader: options.velocityShader,
            name: "velocityTexture",
            size,
            startValue: 0,
            uniforms:  {
                ...options.velocityUniforms,
                positionTexture: positionPass.getTexture(),
                delta: 0.016,
            },
        } );

        const material = new ShaderMaterial( {
            transparent: true,
            depthWrite: false,

            vertexShader: PARTICLE_VERTEX,
            fragmentShader: PARTICLE_FRAGMENT,

            uniforms: {
                positionTexture: { value: positionPass.getTexture() },
                velocityTexture: { value: velocityPass.getTexture() },
                fontTexture: { value: options.velocityUniforms.fontTexture },
            },

            defines: {
                resolution: "vec2( 1024 )",
            },
        } );


        const geometry = new BufferGeometry();

        geometry.addAttribute( "position", new BufferAttribute( new Float32Array( size * size * 3 ), 3 ) );
        geometry.addAttribute( "reference", new BufferAttribute( references, 2 ) );

        super( geometry, material );

        this.frustumCulled = false;
        this.latest = 0;
        this.size = size;

        this.positionPass = positionPass;
        this.velocityPass = velocityPass;
    }

    reset(): void {
        this.positionPass.setValues( generateRandomPosition( this.size ) );
    }

    update( now: number ): void {
        const delta: number = ( now - this.latest ) / 1000;

        this.velocityPass.setUniforms( {
            positionTexture: this.positionPass.getTexture(),
            delta,
        } );

        this.positionPass.setUniforms( {
            velocityTexture: this.velocityPass.getTexture(),
            delta,
        } );

        this.velocityPass.compute();
        this.positionPass.compute();

        const material: ShaderMaterial = this.material as ShaderMaterial;
        material.uniforms.positionTexture.value = this.positionPass.getTexture();
        material.uniforms.velocityTexture.value = this.velocityPass.getTexture();

        this.latest = now;
    }

    updateUniform( name: string, value: UniformValue ): void {
        this.velocityPass.setPermanentUniforms( { [ name ]: value } );
        this.positionPass.setPermanentUniforms( { [ name ]: value } );
    }
}
