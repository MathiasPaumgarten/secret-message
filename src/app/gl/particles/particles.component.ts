import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";

import { FontTexture } from "../font-texture";
import { Particles, UniformValue } from "../particles";
import { DEFAULT_POSITION } from "../shaders";

@Component( {
  selector: "app-particles",
  templateUrl: "./particles.component.html",
  styleUrls: [ "./particles.component.scss" ],
} )
export class ParticlesComponent implements OnInit, OnDestroy {

    @Input() velocity?: string;

    @ViewChild( "canvas" ) canvas: ElementRef<HTMLCanvasElement>;

    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private timeout: number;
    private particles: Particles;

    ngOnInit() {
        if ( !this.velocity ) {
            throw new Error( "ParticlesDirective must be given a velocity shader." );
        }

        const texture = new FontTexture();
        texture.write( "Everybody\npoop" );

        this.renderer = new WebGLRenderer( { canvas: this.canvas.nativeElement, alpha: false } );
        this.renderer.setSize( 1024, 1024 );
        this.renderer.setClearColor( 0 );
        this.camera = new PerspectiveCamera( 90, 1, 1, 10000 );
        this.camera.position.set( 0, 0, -100 );
        this.camera.lookAt( new Vector3() );
        this.scene = new Scene();
        this.particles = new Particles( 128, {
            renderer: this.renderer,

            velocityShader: this.velocity,
            velocityUniforms: {
                mouse: [ 0, 0 ],
                font: texture.getTexture(),
            },

            positionShader: DEFAULT_POSITION,
            positionUniforms: {}
        } );

        this.scene.add( this.particles );

        this.render = this.render.bind( this );
        this.render();
    }

    ngOnDestroy() {
        cancelAnimationFrame(this.timeout);
    }

    setUniforms( value: UniformValue ) {
        this.particles.updateUniform( "mouse", value );
    }

    private render() {
        this.particles.update( Date.now() );
        this.renderer.render( this.scene, this.camera );
        this.timeout = requestAnimationFrame(this.render);
    }

}
