import "./App.css";

function App() {
	return (
		<div className="min-h-screen bg-black text-white">
			<Header />
			<main className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
				<ImgPanel></ImgPanel>
				<PipelinePanel></PipelinePanel>
			</main>
			<ModalsHost></ModalsHost>
		</div>
	);
}

export default App;
