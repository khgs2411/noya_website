SYMPHONY_REVIEWER_PROJECT ?= noya_website
SYMPHONY_REVIEWER_REGISTER ?= /Users/liadgoren/Repositories/openai_symphony/scripts/symphony-reviewer-register
SYMPHONY_REVIEWER_REPO_ROOT ?= $(CURDIR)
SYMPHONY_REVIEWER_PROJECT_EFFECTIVE = $(or $(strip $(PROJECT)),$(strip $(SYMPHONY_REVIEWER_PROJECT)))

ifneq ($(value PROMPT),)
export SYMPHONY_REVIEWER_PROMPT := $(value PROMPT)
endif

.PHONY: register-reviewer
register-reviewer:
	test -n "$(SYMPHONY_REVIEWER_PROJECT_EFFECTIVE)"
ifneq ($(strip $(value PROMPT)),)
	"$(SYMPHONY_REVIEWER_REGISTER)" --project "$(SYMPHONY_REVIEWER_PROJECT_EFFECTIVE)" --prompt "$$SYMPHONY_REVIEWER_PROMPT" --repo-root "$(SYMPHONY_REVIEWER_REPO_ROOT)"
else
	"$(SYMPHONY_REVIEWER_REGISTER)" --project "$(SYMPHONY_REVIEWER_PROJECT_EFFECTIVE)" --repo-root "$(SYMPHONY_REVIEWER_REPO_ROOT)"
endif
