<script lang="ts">
	export let app_name;

	import {DoublePendulum} from './DoublePendulum.js'
	import { paper } from "paper";
	import {hslToRgb} from './util.js'
	

	import { onMount } from 'svelte';

	let canvas
	let lines = []
	onMount(async () => {
		paper.setup(canvas)

		for (let i = 0;i<N-1;i++){
			let path = new paper.Path({
				strokeColor: hslToRgb(1.0*i/N,1.,.5),
				strokeWidth: 20,
				strokeCap: 'round'
			});
			var start = new paper.Point(paper.view.size.width/2,paper.view.size.height/2)
			path.add(start)
			path.add(start.add([1,1]))
			lines.push(path)
		}

		draw_pendulums()
		//paper.view.draw()

	})



	const scaleWidth = 100;
	const scaleHeight = (100 * innerHeight) / innerWidth;
	const scale = Math.min(scaleWidth, scaleHeight);

	const N = 50;

	let pendulums
	let m1 = 100
	let g = 10
	$:pendulums.forEach(p=>{p.m1=m1})
	$:pendulums.forEach(p=>p.g=g/100)
	
	function initPendulums() {

		pendulums = [...Array(N).keys()].map(i => new DoublePendulum({
			width: scaleWidth,
			height: scaleHeight,
			x0: scaleWidth / 2,
			y0: scaleHeight / 2,
			ang0: Math.PI/3,
			ang1: -Math.PI,
			v1: .002-0.000001*(i-250),
			v0: 0,
			acc0: 0,
			acc1: 0,
			baseRad: scale / 70,
			l0: scale / 4.5,
			l1: scale / 4.5,
			r0: scale / 30,
			r1: scale / 30,
			m0: 100,
			m1: m1,
			g: g/100,
			massScaleFactor: 1.2,
			speedScaleFactor: 1.2,
			dt: .01,
			fps: 100,
		}))
	}
	initPendulums()

	function reverse(){
		console.log('reverse')
			pendulums.forEach(p => {
				p.moment0 = -p.moment0;
				p.moment1 = -p.moment1;
			})
			if (bgcolor=='black'){
				bgcolor = 'gray'
			}else{
				bgcolor = 'black'
			}
	}

	function draw_pendulums() {
		for (let i = 0;i<N-1;i++){
			let pos0 = pendulums[i].getLowerBob() 
			let pos1 = pendulums[i+1].getLowerBob()
			let d = Math.sqrt((pos0.x-pos1.x)**2+(pos0.y-pos1.y)**2)

			lines[i].strokeWidth = 50 * Math.exp(-.5*d)
			lines[i].firstSegment.point.x = pos0.x * paper.view.size.width/100
			lines[i].firstSegment.point.y = pos0.y * paper.view.size.height/100
			lines[i].lastSegment.point.x = pos1.x * paper.view.size.width/100
			lines[i].lastSegment.point.y = pos1.y * paper.view.size.height/100
		}
		paper.view.draw()

	}

	function reset_pendulums(){
		console.log('reset')
		for(let i=0;i<N;i++){
			let p = pendulums[i]
			p.v0 = 0
			p.v1 = .002-0.000001*i
			p.ang0 = Math.PI/2
			p.ang1 = -Math.PI
			p.setMoments()
			p.move()
		}

	}
	reset_pendulums();

	let bring_closer = false
	function bring_closer_fn(){
		// pendulum 0 is the leader

		let fac = .9
		let pos_before = pendulums[1].getLowerBob() 
		for (let i=1;i<N;i++){
			pendulums[i].moment0 = fac * pendulums[i].moment0 + (1-fac) * pendulums[0].moment0
			pendulums[i].moment1 = fac * pendulums[i].moment1 + (1-fac)  * (pendulums[0].moment1 + .1*i)
			pendulums[i].ang0 = fac * pendulums[i].ang0 + (1-fac)  * pendulums[0].ang0
			pendulums[i].ang1 = fac * pendulums[i].ang1 + (1-fac)  * pendulums[0].ang1
			
			
			
			//p[i].move()
		}
		let pos_after = pendulums[1].getLowerBob() 
		draw_pendulums()
	}
	function bring_closer_start(){
		bring_closer=true
	}
	function bring_closer_stop(){
		bring_closer=false
	}
 
	setInterval(()=>{
		if (oscs.length == 0){
			return
		}
		for (let j=0;j<20;j++){
            pendulums.map(x=>x.move());
        }
		if (bring_closer){
			bring_closer_fn()
		}
		for(let i=0;i<N;i++){
			let y = pendulums[i].getLowerBob().y;
			oscs[i].frequency.setValueAtTime(5*y, audioCtx.currentTime);
		}

		draw_pendulums();

	},5)
	
	// create web audio api context
	const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

	// create Oscillator node
	let freq = 400;

	let oscs = [];
	const gainNode = audioCtx.createGain();
	gainNode.gain.value = .9/N;
	gainNode.connect(audioCtx.destination);

	function init(){
		console.log('init')
		stop();
		for (let i=0;i<N;i++){
			const osc = audioCtx.createOscillator();
			osc.type = 'sine';
			osc.connect(gainNode);
			oscs.push(osc);
		}
		start();
	}

	function start(){
		oscs.forEach(osc=>osc.start())
	}

	function stop() {
		oscs.forEach(osc=>{osc.stop();osc.disconnect();})
		oscs=[];
	}

	function resetPositions() {
		reset_pendulums()
		draw_pendulums()
		bgcolor = 'black'
	}


	
	let bgcolor = 'black'
</script>

<main>
	
	<div>
		<span>{app_name}</span>
		<button on:click={init}>Start</button>
		<button on:click={stop}>Stop</button>
		<button on:click={resetPositions}>Reset</button>
		<button on:click={reverse}>Reverse</button>
		<button on:mousedown={bring_closer_start} on:mouseup={bring_closer_stop}>Closer</button>
		<input type=range bind:value={m1} min=10 max=200>
		<input type=range bind:value={g} min=0 max=100>
	</div>
	<canvas style="--bg-color: {bgcolor}" bind:this={canvas} resize></canvas>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	canvas[resize] {
		width: 100%;
		height: 100%;
		background: var(--bg-color);
	}
</style>