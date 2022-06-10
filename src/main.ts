import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		app_name: "dope"
	}
});

export default app;