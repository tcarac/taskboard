.PHONY: build dev frontend clean install

BUILD_DIR := cmd/taskboard
BINARY := taskboard

build: frontend
	go build -o $(BINARY) ./$(BUILD_DIR)

dev:
	go run ./$(BUILD_DIR) start

frontend:
	cd web && npm install && npm run build
	mkdir -p $(BUILD_DIR)/web/dist
	cp -r web/dist/* $(BUILD_DIR)/web/dist/

clean:
	rm -f $(BINARY)
	rm -rf $(BUILD_DIR)/web
	rm -rf web/dist web/node_modules

install: build
	cp $(BINARY) /usr/local/bin/

dev-frontend:
	cd web && npm run dev

test:
	go test ./...
