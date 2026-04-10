import { useCallback, useEffect, useState } from "react";
import { fetchCommunityPresets, fetchUserPresets } from "../../../api/presets";
import { PresetCard } from "./PresetCard";
import "./PresetModal.css";

export type PresetListItem = {
	id: string;
	name: string;
	description: string;
	creator_id: string;
	created_at: string;
	votes: number;
	creator_name?: string | null;
};

function useDebounce<T>(
	value: T,
	delay: number,
	onDebounced?: (value: T) => void,
) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => {
			setDebounced(value);
			onDebounced?.(value);
		}, delay);

		return () => clearTimeout(id);
	}, [value, delay, onDebounced]);

	return debounced;
}

type PaginationInfo = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
};

function fetchPresets(
	section: "mine" | "community",
	query: string,
	sort: "newest" | "oldest",
	page: number,
	signal?: AbortSignal,
) {
	if (section === "mine") {
		return fetchUserPresets(query, sort, page, signal);
	} else {
		return fetchCommunityPresets(query, sort, page, signal);
	}
}

export function PresetModal({
	open,
	onClose,
	onApply,
}: {
	open: boolean;
	onClose: () => void;
	onApply: (presetJson: string) => void;
}) {
	const [section, setSection] = useState<"mine" | "community">("community");
	const [content, setContent] = useState<PresetListItem[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [sort, setSort] = useState<"newest" | "oldest">("newest");
	const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
		null,
	);
	const [page, setPage] = useState(1);

	const handleDebouncedQuery = useCallback(() => {
		setPage((prev) => (prev === 1 ? prev : 1));
	}, []);

	const debouncedQuery = useDebounce(inputValue, 400, handleDebouncedQuery);

	const goToFirstPage = () => setPage(1);

	const handleSectionChange = (nextSection: "mine" | "community") => {
		if (nextSection === section) return;
		setSection(nextSection);
		goToFirstPage();
	};

	const handleSortChange = (nextSort: "newest" | "oldest") => {
		if (nextSort === sort) return;
		setSort(nextSort);
		goToFirstPage();
	};

	useEffect(() => {
		const controller = new AbortController();

		async function loadPresets() {
			try {
				const { items, pagination } = await fetchPresets(
					section,
					debouncedQuery,
					sort,
					page,
					controller.signal,
				);
				console.log(items, pagination);
				setContent(items);
				setPaginationInfo(pagination);
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") return;
				console.error(err);
			}
		}

		loadPresets();

		return () => {
			controller.abort();
		};
	}, [debouncedQuery, sort, section, page]);

	if (!open) return null;
	return (
		<div
			className="preset-modal__overlay"
			role="dialog"
			aria-modal="true"
			aria-label="Presets"
			onClick={onClose}
		>
			<div className="preset-modal" onClick={(e) => e.stopPropagation()}>
				<header className="preset-modal__header">
					<h2 className="preset-modal__title">Presets</h2>

					<div className="preset-modal__header-actions">
						<button
							type="button"
							className={`preset-modal__tab ${section === "mine" ? "preset-modal__tab--active" : ""}`}
							onClick={() => handleSectionChange("mine")}
						>
							My presets
						</button>
						<button
							type="button"
							className={`preset-modal__tab ${section === "community" ? "preset-modal__tab--active" : ""}`}
							onClick={() => handleSectionChange("community")}
						>
							Community
						</button>

						<button
							type="button"
							className="preset-modal__close"
							onClick={onClose}
							aria-label="Close presets modal"
						>
							×
						</button>
					</div>
				</header>

				<div className="preset-modal__toolbar">
					<input
						type="text"
						className="preset-modal__search"
						placeholder="Search presets..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
					/>

					<select
						className="preset-modal__sort"
						value={sort}
						onChange={(e) =>
							handleSortChange(
								e.target.value as "newest" | "oldest",
							)
						}
					>
						<option value="newest">Newest</option>
						<option value="oldest">Oldest</option>
					</select>
				</div>

				<section className="preset-modal__content">
					<div className="preset-modal__list">
						{content.length === 0 ? (
							<p className="preset-modal__empty">
								No presets found.
							</p>
						) : (
							content.map((preset) => (
								<PresetCard
									key={preset.id}
									preset={preset}
									onApply={onApply}
								/>
							))
						)}
					</div>
				</section>

				<footer className="preset-modal__footer">
					<button
						type="button"
						className="preset-modal__page-btn"
						disabled={!paginationInfo?.hasPrev}
						onClick={() => setPage((prev) => prev - 1)}
					>
						Previous
					</button>

					<span className="preset-modal__page-info">
						Page {paginationInfo?.page ?? 1} of{" "}
						{paginationInfo?.totalPages ?? 1}
					</span>

					<button
						type="button"
						className="preset-modal__page-btn"
						disabled={!paginationInfo?.hasNext}
						onClick={() => setPage((prev) => prev + 1)}
					>
						Next
					</button>
				</footer>
			</div>
		</div>
	);
}
