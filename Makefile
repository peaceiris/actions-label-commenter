.PHONY: create-pre-release
create-pre-release:
	bash ./scripts/pre-release.sh
	git rev-parse HEAD

.PHONY: pre-release
pre-release: create-pre-release
	git rm -f ./lib/*
	git commit -m "chore(release): Remove build assets [skip ci]"
