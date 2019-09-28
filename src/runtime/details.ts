import { getElementCSSFontValue } from "./polyfill.js";

document.addEventListener(
  "DOMContentLoaded",
  function(this: Document) {
    const SUMMARY_ELEMENT = "SUMMARY";
    const MOVABLE_ELEMENT_CLASS = "movable-element";
    const MOVING_ELEMENTS_CLASS = "moving-elements";
    const LINE_HEIGHT = parseInt(
      window
        .getComputedStyle(document.querySelector(".experience p") as Element)
        .getPropertyValue("line-height")
        .slice(0, -2)
    );
    const detailsSupport = window.hasOwnProperty("HTMLDetailsElement");
    const summaryElem: NodeListOf<HTMLElement> = this.querySelectorAll(
      SUMMARY_ELEMENT
    );
    const canvasContext = detailsSupport
      ? (document
          .createElement("canvas")
          .getContext("2d") as CanvasRenderingContext2D)
      : <never>{};
    canvasContext.font = getElementCSSFontValue(this.querySelector(
      "p"
    ) as Element);

    const animateElementsBelow = (
      parentElement: HTMLElement,
      height: number,
      callback: Function
    ) => {
      // The goal of this function is to make the animation smoother using JS than
      // the one using only CSS. However, if the user disables JS, the animation still works.
      const articleIndex = Array.prototype.indexOf.call(
        document.querySelectorAll("main>.experience>*"),
        parentElement
      );
      const movableElements = document.querySelectorAll(
        [
          "main>.experience~section",
          `main>.experience>article:nth-child(n + ${articleIndex + 2})`,
          `main>.experience>article:nth-child(${articleIndex + 1})>details+*`,
        ].join(",")
      );

      document.body.style.setProperty("--movable-height", height + "px");
      document.body.classList.add(MOVING_ELEMENTS_CLASS);
      parentElement.classList.add(MOVABLE_ELEMENT_CLASS + "-after");
      for (const movableElement of movableElements) {
        movableElement.classList.add(MOVABLE_ELEMENT_CLASS);
      }

      // When the animation has ended, cleaning up
      movableElements.item(0).addEventListener(
        "transitionend",
        () => {
          callback();
          parentElement.classList.remove(MOVABLE_ELEMENT_CLASS + "-after");
          for (const movableElement of movableElements) {
            movableElement.classList.remove(MOVABLE_ELEMENT_CLASS);
          }
          document.body.classList.remove(MOVING_ELEMENTS_CLASS);
        },
        { once: true, passive: true }
      );
    };

    for (const elem of summaryElem) {
      if (detailsSupport) {
        // Allow the user to close the detail element by clicking on it
        // And add smooth transition when elements are changing height
        (elem.parentNode as Element).addEventListener(
          "click",
          function(this: HTMLDetailsElement, ev: Event) {
            // The details should close (collapse) only if it's already open and
            // the user is not trying to select text
            const shouldClose =
              this.open && (window.getSelection() || <never>{}).isCollapsed;
            if (shouldClose) {
              // Compute the actual height of the element before
              // the transition starts
              const currentHeight = this.offsetHeight;
              this.style.height = currentHeight + "px";
              window.requestAnimationFrame(() => {
                const minHeight = parseInt(
                  (this.style.minHeight as string).slice(0, -2)
                );

                animateElementsBelow(
                  this.parentElement as HTMLElement,
                  minHeight - currentHeight,
                  () => {
                    // Set the height at the last known to start the transition
                    this.style.height = "";
                    this.style.minHeight = "";
                  }
                );
              });
            } else {
              const summaryHeight = (<HTMLElement>this.firstElementChild)
                .offsetHeight;

              // Removing CSS height in case the transition did not end
              this.style.height = "";

              // Saving the current height to allow sweet transition
              this.style.minHeight = summaryHeight + "px";

              // Selecting the paragraph that will appear
              const paragraph = <HTMLElement>(
                this.querySelector(
                  `p[lang='${document.documentElement.getAttribute("lang")}']`
                )
              );

              const estimatedHeight =
                Math.ceil(
                  canvasContext.measureText(paragraph.textContent || <never>"")
                    .width / this.offsetWidth
                ) * LINE_HEIGHT;

              // Triggers CSS animation
              // paragraph.style.position = "absolute";
              paragraph.style.position = "absolute";
              animateElementsBelow(
                this.parentElement as HTMLElement,
                estimatedHeight - summaryHeight,
                () => {
                  paragraph.style.removeProperty("position");
                }
              );
            }
            if (
              SUMMARY_ELEMENT !== (<HTMLElement>ev.target).nodeName &&
              shouldClose
            ) {
              this.open = false;
            }
          },
          true
        );
      } else {
        // For browsers that do not support <details>, let's hide the summaries
        elem.hidden = true;
      }
    }
  },
  false
);
