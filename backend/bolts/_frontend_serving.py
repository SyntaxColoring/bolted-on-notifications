import fastapi
from fastapi.staticfiles import StaticFiles

from starlette.exceptions import HTTPException
from starlette.types import Scope


app = fastapi.FastAPI()


_known_paths = {
    # This needs to be kept in sync with the frontend.
    #
    # The root path "/" is omitted from here because it's handled by html=True.
    #
    # These paths should not have a trailing slash, to match what get_response()
    # seems to be given (determined experimentally).
    "communal-textarea",
    "button-funtown",
}


class _SPAStaticFiles(StaticFiles):
    """Serve a single page app's static files out of a directory.

    index.html is used as the 404 page. We expect it to have JavaScript to show a
    "page not found" message if it doesn't recognize the URL.

    Modified from: https://github.com/encode/starlette/issues/437#issuecomment-567671832
    """

    async def get_response(self, path: str, scope: Scope):
        try:
            return await super().get_response(path, scope)
        except HTTPException as ex:
            if ex.status_code == 404:
                response = await super().get_response("index.html", scope)
                if path not in _known_paths:
                    response.status_code = 404
                return response
            else:
                raise ex


app.mount("/", _SPAStaticFiles(directory="static_files", html=True), name="static")
