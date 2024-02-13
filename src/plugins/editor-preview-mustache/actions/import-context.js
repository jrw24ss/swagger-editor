import ShortUniqueId from 'short-unique-id';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * Action types.
 */

export const EDITOR_PREVIEW_MUSTACHE_IMPORT_CONTEXT_STARTED =
  'editor_preview_mustache_import_context_started';
export const EDITOR_PREVIEW_MUSTACHE_IMPORT_CONTEXT_SUCCESS =
  'editor_preview_mustache_import_context_success';
export const EDITOR_PREVIEW_MUSTACHE_IMPORT_CONTEXT_FAILURE =
  'editor_preview_mustache_import_context_failure';

/**
 * Action creators.
 */

export const importContextStarted = ({ url, requestId }) => ({
  type: EDITOR_PREVIEW_MUSTACHE_IMPORT_CONTEXT_STARTED,
  payload: url,
  meta: {
    requestId,
  },
});

export const importContextSuccess = ({ context, requestId }) => ({
  type: EDITOR_PREVIEW_MUSTACHE_IMPORT_CONTEXT_SUCCESS,
  payload: context,
  meta: { requestId },
});

export const importContextFailure = ({ error, url, requestId }) => {
  const errorMessage = 'Unknown error occurred';

  return {
    type: EDITOR_PREVIEW_MUSTACHE_IMPORT_CONTEXT_FAILURE,
    payload: error,
    error: true,
    meta: { url, errorMessage, requestId },
  };
};

/**
 * Async thunks.
 */
export const importContext = (url) => {
  const uid = new ShortUniqueId({ length: 10 });

  return async (system) => {
    const { editorPreviewMustacheActions, editorSelectors, fn } = system;
    const requestId = uid();
    const sanitizedUrl = sanitizeUrl(url);

    editorPreviewMustacheActions.importContextStarted({ url: sanitizedUrl, requestId });

    if (typeof editorSelectors?.selectEditor === 'undefined') {
      return editorPreviewMustacheActions.importContextFailure({
        error: new Error('No editor plugin available'),
        url: sanitizedUrl,
        requestId,
      });
    }

    if (typeof fn.getApiDOMWorker === 'undefined') {
      return editorPreviewMustacheActions.importContextFailure({
        error: new Error('ApiDOM worker not available'),
        url: sanitizedUrl,
        requestId,
      });
    }

    if (sanitizedUrl === 'about:blank') {
      return editorPreviewMustacheActions.importUrlFailure({
        error: new Error('Invalid url provided'),
        url: sanitizedUrl,
        requestId,
      });
    }

    try {
      const editor = editorSelectors.selectEditor();
      const worker = await fn.getApiDOMWorker()(editor.getModel().uri); // eslint-disable-line no-unused-vars

      return editorPreviewMustacheActions.importContextSuccess({
        context: '{"importedContext": "true"}',
        requestId,
      });
    } catch (error) {
      return editorPreviewMustacheActions.importContextFailure({
        error,
        url: sanitizedUrl,
        requestId,
      });
    }
  };
};
