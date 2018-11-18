import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    SimpleChanges,
} from "@angular/core";
import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";

import { FontTexture } from "../font-texture";
import { Particles, UniformValue } from "../particles";
import { DEFAULT_POSITION } from "../shaders";

/**
 * Wrapper component that renders the particle filter. It contains a THREE scene and handles the shader-pass
 * necessary. Internally, the particle position is along a coordinate system that goes from -100 to 100. This is
 * due to the distance from the camera.
 * It is scaled to fill the view port. All position uniforms have to consider that depending on the screen layout,
 * there might be letter boxing either vertially or horizontally.
 */
@Component( {
    selector: "app-particles",
    templateUrl: "./particles.component.html",
    styleUrls: [ "./particles.component.scss" ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ParticlesComponent implements OnInit, OnDestroy, OnChanges {

    @Input() velocity?: string;
    @Input() width = 1024;
    @Input() height = 1024;
    @Input() message = "";

    @ViewChild( "canvas" ) canvas: ElementRef<HTMLCanvasElement>;

    get canvasOffset() {
        return `translateY( ${ - this.offset }px )`;
    }

    private offset = 0;
    private canvasSize = Math.max( window.innerWidth, window.innerHeight );
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private timeout: number;
    private particles: Particles;

    @HostListener( "window:mousemove", [ "$event" ] )
    private onMouseMove( event: MouseEvent ) {
        if ( ! this.particles ) return;

        this.particles.updateUniform(
            "mouse",
            this.transformPosition(
                event.pageX / this.canvasSize,
                ( event.pageY + this.offset ) / this.canvasSize,
            )
        );
    }

    ngOnInit() {
        if ( !this.velocity ) {
            throw new Error( "ParticlesDirective must be given a velocity shader." );
        }

        const texture = new FontTexture();
        texture.write( this.message );

        this.renderer = new WebGLRenderer( { canvas: this.canvas.nativeElement, alpha: false } );
        this.renderer.setSize( this.width, this.height );
        this.renderer.setClearColor( 0 );

        // TODO: change z distance from the center to 1 so that all -100 to 100 calculations can be changed to -1 to 1.
        this.camera = new PerspectiveCamera( 90, 1, 1, 1000 );
        this.camera.position.set( 0, 0, -100 );
        this.camera.lookAt( new Vector3() );

        this.scene = new Scene();

        this.particles = new Particles( 128, {
            renderer: this.renderer,

            velocityShader: this.velocity,
            velocityUniforms: {
                mouse: [ -1000, -1000 ],
                fontTexture: texture.getTexture(),
            },

            positionShader: DEFAULT_POSITION,
            positionUniforms: {
                mouse: [ 0, 0 ]
            }
        } );

        this.scene.add( this.particles );

        this.render = this.render.bind( this );
        this.calculateSize();
        this.render();
    }

    ngOnChanges( changes: SimpleChanges ) {
        if ( changes[ "width" ] || changes[ "height" ] ) {
            if ( this.camera ) {
                this.calculateSize();
            }
        }
    }

    ngOnDestroy() {
        cancelAnimationFrame( this.timeout );
    }

    private calculateSize() {
        this.canvasSize = Math.max( this.width, this.height );
        this.offset = ( this.canvasSize - this.height ) / 2;

        this.camera.updateProjectionMatrix();
        this.renderer.setSize( this.canvasSize, this.canvasSize );
    }

    private render() {
        this.particles.update( Date.now() );
        this.renderer.render( this.scene, this.camera );
        this.timeout = requestAnimationFrame( this.render );
    }

    /**
     * Projects coordinates from 0 - 1 onto -100 to 100 scaled to match screen size to shader position.
     */
    private transformPosition( x: number, y: number ): [ number, number ] {
        return [
            ( ( x * 2.0 ) - 1.0 ) * -100,
            ( ( y * 2.0 ) - 1.0 ) * -100,
        ];
    }
}
