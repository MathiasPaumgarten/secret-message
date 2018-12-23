import { Component, OnInit, ViewChild, ElementRef, HostListener, ChangeDetectionStrategy } from "@angular/core";
import { ParticlesComponent } from "../gl/particles/particles.component";

@Component( {
    selector: "app-create",
    templateUrl: "./create.component.html",
    styleUrls: [ "./create.component.scss" ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class CreateComponent implements OnInit {
    velocityShader = VELOCITY;
    glWidth = 512;
    glHeight = 512;

    private readonly FONT_SIZE = 40;
    private readonly LINE_HEIGHT = 60;

    private text = "clay";
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    @ViewChild( ParticlesComponent ) private particles?: ParticlesComponent;
    @ViewChild( "input" ) private inputElement?: ElementRef<HTMLInputElement>;

    @HostListener( "window:resize" )
    private onResize() {
        this.glWidth = this.canvas.width = window.innerWidth;
        this.glHeight = this.canvas.height = window.innerHeight;

        this.renderCanvas();
    }

    ngOnInit() {
        this.inputElement.nativeElement.focus();
        this.canvas = document.createElement( "canvas" );
        this.context = this.canvas.getContext( "2d" );
        this.onResize();
    }

    onInputUpdate( value: string ) {
        this.text = value;
        this.renderCanvas();
        this.particles.refall();
    }

    private renderCanvas() {
        this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
        this.context.fillStyle = "rgba( 255, 0, 0, 1 )";
        this.context.font = `bold ${ this.FONT_SIZE }px Arial`;
        this.context.textBaseline = "middle";

        const words = this.text.split( "\n" );

        words.forEach( ( word: string, i: number ) => {
            const offset = ( words.length - 1 ) / 2;
            this.context.fillText( word, 10, window.innerHeight / 2 - offset * this.LINE_HEIGHT + i * this.LINE_HEIGHT );
        } );
    }
}

const VELOCITY = `
    uniform sampler2D velocityTexture;
    uniform sampler2D positionTexture;
    uniform sampler2D fontTexture;
    uniform vec2 mouse;

    const vec3 gravity = vec3( 0, -9.0, 0 );
    const vec4 noChange = vec4( vec3( 0 ), 1 );
    const vec3 maxSpeed = vec3( 0, -250.0, 0 );

    float not( float value ) {
        return 1.0 - value;
    }

    float or( float a, float b ) {
        return min( 1.0, a + b );
    }

    float and( float a, float b ) {
        return step( 1.5, a + b );
    }

    vec2 calcRelativePoisition( vec2 position ) {
        vec2 xy = ( position.xy + vec2( 100 ) ) / vec2( 200 );
        return vec2( 1, 0 ) + vec2( -1, 1 ) * xy ;
    }

    vec4 ifElse( float edge, vec4 ifValue, vec4 elseValue ) {
        return mix( ifValue, elseValue, not( edge ) );
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 velocity = texture2D( velocityTexture, uv ).xyz;
        vec3 position = texture2D( positionTexture, uv ).xyz;
        vec2 xy = calcRelativePoisition( position.xy );
        vec3 font = texture2D( fontTexture, xy ).rgb;

        float isOnText = float( length( font ) > 0.0 );
        float isUntouched = float( length( velocity ) == 0.0 );
        float isWithinMouse = float( distance( position.xy, mouse ) < 20.0 );

        float shouldDrop = or( not( isUntouched ), isWithinMouse );
        vec4 dropping = vec4( max( velocity + gravity, maxSpeed ), 1 );

        gl_FragColor = ifElse(
            isOnText,
            noChange,
            ifElse(
                shouldDrop,
                dropping,
                noChange
            )
        );
    }
`;
