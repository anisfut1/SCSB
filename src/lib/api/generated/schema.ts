/**
 * AUTO-GENERATED — DO NOT EDIT.
 *
 * Généré depuis le contrat OpenAPI de club-manager-api via
 * `npm run api:generate`. Toute modification manuelle sera perdue à la
 * prochaine génération. Voir docs/API_CLIENT.md.
 */
export interface paths {
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Utilisateur courant */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MeDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Clubs dont l'utilisateur est membre */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            clubs: components["schemas"]["ClubDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Détail du club */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClubDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UpdateClubDto"];
                };
            };
            responses: {
                /** @description Club mis à jour (branding uniquement) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClubDto"];
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/clubs/{clubId}/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Capacités du club (FBI facultatif) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClubCapabilities"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/teams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Équipes du club (y compris sans engagement FFBB, voir docs/TEAMS.md) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            teams: components["schemas"]["TeamDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreateTeamDto"];
                };
            };
            responses: {
                /** @description Équipe créée */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TeamDto"];
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/teams/{teamId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    teamId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UpdateTeamDto"];
                };
            };
            responses: {
                /** @description Équipe mise à jour */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TeamDto"];
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/clubs/{clubId}/matches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    period?: "weekend" | "upcoming" | "past";
                    from?: string;
                    to?: string;
                    teamId?: string;
                    homeAway?: "home" | "away";
                    status?: "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
                    limit?: number;
                    offset?: number | null;
                };
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Matchs du club (filtrés, paginés) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            matches: components["schemas"]["MatchListItemDto"][];
                            pagination: components["schemas"]["MatchesPaginationDto"];
                        };
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/matches/{matchId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Détail du match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MatchDetailsDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/matches/{matchId}/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Documents e-Marque du match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            documents: components["schemas"]["MatchDocumentDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/emarque-imports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    matchId?: string;
                    status?: "discovered" | "downloading" | "downloaded" | "parsing" | "imported" | "error" | "needs_review";
                    from?: string;
                    to?: string;
                    limit?: number;
                    offset?: number | null;
                };
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Imports e-Marque du club (filtrés, paginés) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            imports: components["schemas"]["EmarqueImportDto"][];
                            pagination: components["schemas"]["MatchesPaginationDto"];
                        };
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Statut des intégrations */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["IntegrationStatusDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["SaveFbiCredentialsDto"];
                };
            };
            responses: {
                /** @description Identifiants enregistrés (jamais le mot de passe) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SaveFbiCredentialsResponseDto"];
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["PatchFbiIntegrationDto"];
                };
            };
            responses: {
                /** @description Réglages FBI mis à jour */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            fbi: components["schemas"]["FbiIntegrationStatusDto"];
                        };
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Résultat du test (HttpFbiClient, ou BrowserFbiClient en repli) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            success: boolean;
                            message: string;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi/process-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Lot de jobs FBI du club traité (discover_emarque/test_connection en attente) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            claimed: number;
                            succeeded: number;
                            failed: number;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi/reconcile-schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Job de rapprochement calendrier FFBB/FBI empilé (un seul par club à la fois) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            queued: true;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi/parse-documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Lot de documents e-Marque téléchargés du club parsés (OCR/PDF, jamais de navigateur) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            candidatesExamined: number;
                            imported: number;
                            errors: number;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/sync-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Historique des synchronisations */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            syncRuns: components["schemas"]["SyncRunDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/ffbb/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Résultat de la synchronisation */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** Format: uuid */
                            syncRunId: string;
                            status: string;
                            stats: {
                                [key: string]: number;
                            };
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/ffbb": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["PatchFfbbIntegrationDto"];
                };
            };
            responses: {
                /** @description Intégration FFBB mise à jour (jamais de suppression de l'historique déjà synchronisé) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            clubCode: string;
                            enabled: boolean;
                            nextSyncAt: string | null;
                        };
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/clubs/{clubId}/licencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Roster du club */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LicenciesListDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/licencies/{licencieId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    licencieId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Fiche joueur : identité, historique des matchs, statistiques par match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LicencieProfileDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/licencies/{licencieId}/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    licencieId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UpdateLicencieProfileDto"];
                };
            };
            responses: {
                /** @description Profil mis à jour (champs admin, ou contact/photo si le licencié lui-même) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LicencieDto"];
                    };
                };
                /** @description Requête invalide */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Conflit métier */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/clubs/{clubId}/issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Anomalies e-Marque à vérifier */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            issues: components["schemas"]["IssueDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/issues/{matchId}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Anomalie résolue */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            resolved: true;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/jobs/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    jobId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Statut du job */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["JobStatusDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/platform/clubs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Clubs de la plateforme (platform_admin) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            clubs: components["schemas"]["PlatformClubDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreateClubDto"];
                };
            };
            responses: {
                /** @description Club créé */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** Format: uuid */
                            clubId: string;
                            slug: string;
                            adminInviteError: string | null;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description État du service */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            status: "ok";
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        MeDto: {
            /** Format: uuid */
            id: string;
            email: string | null;
            displayName: string | null;
            isPlatformAdmin: boolean;
        };
        ErrorEnvelope: {
            error: {
                code: string;
                message: string;
            };
        };
        ClubDto: {
            /** Format: uuid */
            id: string;
            slug: string;
            name: string;
            shortName: string | null;
            logoUrl: string | null;
            accentColor: string | null;
            timezone: string;
            /** @enum {string} */
            status: "active" | "suspended";
            roles: components["schemas"]["ClubRole"][];
            ffbbClubCode: string;
        };
        /** @enum {string} */
        ClubRole: "club_admin" | "correspondant_club" | "responsable_tables" | "coach" | "joueur" | "parent";
        UpdateClubDto: {
            name?: string;
            shortName?: string | null;
            timezone?: string;
            /** Format: uri */
            logoUrl?: string | null;
            accentColor?: string | null;
        };
        ClubCapabilities: {
            ffbb: boolean;
            fbi: boolean;
            emarque: boolean;
        };
        TeamDto: {
            /** Format: uuid */
            id: string;
            name: string;
            category: string | null;
            /** @enum {string|null} */
            sexe: "M" | "F" | null;
            numeroEquipe: string | null;
            active: boolean;
        };
        CreateTeamDto: {
            name: string;
            category?: string | null;
            /** @enum {string|null} */
            sexe?: "M" | "F" | null;
            numeroEquipe?: string | null;
        };
        UpdateTeamDto: {
            name?: string;
            category?: string | null;
            /** @enum {string|null} */
            sexe?: "M" | "F" | null;
            numeroEquipe?: string | null;
            active?: boolean;
        };
        MatchListItemDto: {
            /** Format: uuid */
            id: string;
            numero: string | null;
            journee: string | null;
            matchDatetime: string | null;
            isHome: boolean | null;
            teamName: string | null;
            opponentName: string | null;
            opponentLogoUrl: string | null;
            venueLabel: string | null;
            scoreHome: number | null;
            scoreAway: number | null;
            /** @enum {string} */
            status: "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
            emarqueStatus: string;
        };
        MatchesPaginationDto: {
            limit: number;
            offset: number;
            total: number;
        };
        MatchDetailsDto: {
            /** Format: uuid */
            id: string;
            numero: string | null;
            journee: string | null;
            matchDatetime: string | null;
            isHome: boolean | null;
            teamName: string | null;
            opponentName: string | null;
            opponentLogoUrl: string | null;
            venueLabel: string | null;
            scoreHome: number | null;
            scoreAway: number | null;
            /** @enum {string} */
            status: "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
            emarque: components["schemas"]["EmarqueSummaryDto"];
            participants: components["schemas"]["MatchParticipantDto"][];
            coaches: components["schemas"]["MatchCoachDto"][];
            officials: components["schemas"]["MatchOfficialDto"][];
            tableOfficials: components["schemas"]["MatchOfficialDto"][];
            stats: components["schemas"]["PlayerMatchStatsDto"][];
        };
        EmarqueSummaryDto: {
            status: string;
            source: string | null;
            lastRetrievedAt: string | null;
            qualityWarningCount: number | null;
            parserVersion: string | null;
            discoveredAt: string | null;
            importedAt: string | null;
            qualityWarnings: components["schemas"]["QualityWarningDto"][];
            lastError: components["schemas"]["SanitizedErrorDto"];
        };
        QualityWarningDto: {
            code: string;
            message: string;
            /** @enum {string} */
            severity: "info" | "warning" | "error";
        };
        SanitizedErrorDto: {
            code: string;
            message: string;
        } | null;
        MatchParticipantDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            teamSide: "home" | "away";
            jerseyNumber: string | null;
            firstName: string | null;
            lastName: string | null;
            isCaptain: boolean;
            isStarter: boolean | null;
            /** Format: uuid */
            licencieId: string | null;
        };
        MatchCoachDto: {
            /** @enum {string} */
            teamSide: "home" | "away";
            /** @enum {string} */
            role: "principal" | "adjoint";
            firstName: string | null;
            lastName: string | null;
            /** Format: uuid */
            licencieId: string | null;
        };
        MatchOfficialDto: {
            role: string;
            firstName: string | null;
            lastName: string | null;
            /** Format: uuid */
            licencieId: string | null;
        };
        PlayerMatchStatsDto: {
            /** Format: uuid */
            participantId: string;
            /** @enum {string} */
            teamSide: "home" | "away";
            jerseyNumber: string | null;
            firstName: string | null;
            lastName: string | null;
            /** Format: uuid */
            licencieId: string | null;
            secondsPlayed: number | null;
            points: number | null;
            threePointsMade: number | null;
            twoPointsInteriorMade: number | null;
            twoPointsExteriorMade: number | null;
            freeThrowsMade: number | null;
            foulsCommitted: number | null;
        };
        MatchDocumentDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            type: "emarque_zip" | "match_sheet" | "summary" | "shot_chart" | "other";
            filename: string | null;
            mimeType: string | null;
            /** @enum {string} */
            status: "downloaded" | "parsing" | "imported" | "error";
            discoveredAt: string;
            downloadedAt: string | null;
            downloadUrl: string | null;
        };
        EmarqueImportDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            matchId: string;
            /** @enum {string} */
            status: "discovered" | "downloading" | "downloaded" | "parsing" | "imported" | "error" | "needs_review";
            /** @enum {string} */
            source: "fbi";
            parserVersion: string | null;
            discoveredAt: string;
            downloadedAt: string | null;
            importedAt: string | null;
            qualityWarnings: components["schemas"]["QualityWarningDto"][];
            lastError: components["schemas"]["SanitizedErrorDto"];
            attemptCount: number;
            nextAttemptAt: string | null;
        };
        IntegrationStatusDto: {
            ffbb: {
                enabled: boolean;
                lastSyncAt: string | null;
                lastSyncStatus: string | null;
            };
            fbi: components["schemas"]["FbiIntegrationStatusDto"];
        };
        FbiIntegrationStatusDto: {
            configured: boolean;
            username: string | null;
            connected: boolean;
            lastLoginAt: string | null;
            autoImportEmarque: boolean;
            lastError: string | null;
        };
        SaveFbiCredentialsResponseDto: {
            /** @enum {boolean} */
            saved: true;
            fbi: components["schemas"]["FbiIntegrationStatusDto"];
        };
        SaveFbiCredentialsDto: {
            username: string;
            password?: string;
        };
        PatchFbiIntegrationDto: {
            enabled?: boolean;
            autoImportEmarque?: boolean;
        };
        SyncRunDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            provider: "ffbb" | "fbi";
            /** @enum {string} */
            status: "running" | "success" | "partial" | "error";
            startedAt: string;
            finishedAt: string | null;
            errorLog: string | null;
        };
        PatchFfbbIntegrationDto: {
            clubCode?: string;
            enabled?: boolean;
        };
        LicenciesListDto: {
            licencies: components["schemas"]["LicencieDto"][];
        };
        LicencieDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            clubId: string;
            firstName: string;
            lastName: string;
            licenseNumber: string | null;
            birthDate: string | null;
            email: string | null;
            phone: string | null;
            photoUrl: string | null;
            /** Format: uuid */
            teamId: string | null;
            active: boolean;
        };
        LicencieProfileDto: {
            licencie: components["schemas"]["LicencieDto"];
            canEdit: boolean;
            isSelf: boolean;
            matches: components["schemas"]["LicencieMatchDto"][];
        };
        LicencieMatchDto: {
            /** Format: uuid */
            matchId: string;
            numero: string | null;
            matchDatetime: string | null;
            isHome: boolean | null;
            opponentName: string | null;
            scoreHome: number | null;
            scoreAway: number | null;
            /** @enum {string} */
            status: "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
            jerseyNumber: string | null;
            isCaptain: boolean;
            isStarter: boolean | null;
            stats: {
                secondsPlayed: number | null;
                points: number | null;
                threePointsMade: number | null;
                twoPointsInteriorMade: number | null;
                twoPointsExteriorMade: number | null;
                freeThrowsMade: number | null;
                foulsCommitted: number | null;
            } | null;
        };
        UpdateLicencieProfileDto: {
            /** Format: uri */
            photoUrl?: string | null;
            /** Format: email */
            email?: string | null;
            phone?: string | null;
            firstName?: string;
            lastName?: string;
            /** Format: date */
            birthDate?: string | null;
            licenseNumber?: string | null;
            /** Format: uuid */
            teamId?: string | null;
            active?: boolean;
        };
        IssueDto: {
            /** Format: uuid */
            matchId: string | null;
            numero: string | null;
            opponentName: string | null;
            matchDatetime: string | null;
            /** @enum {string} */
            integration: "emarque" | "fbi_schedule" | "scheduling";
            /** @enum {string} */
            type: "emarque_import_error" | "emarque_needs_review" | "fbi_schedule_mismatch" | "fbi_schedule_missing_in_ffbb" | "fbi_schedule_missing_in_fbi" | "venue_time_conflict";
            /** @enum {string} */
            severity: "warning" | "error";
            /** @enum {string} */
            status: "open";
            message: string;
            technicalCode: string;
            qualityWarnings: components["schemas"]["QualityWarningDto"][];
            createdAt: string | null;
            resolvedAt: string | null;
        };
        JobStatusDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            type: "test_connection" | "discover_emarque" | "reconcile_schedule";
            /** @enum {string} */
            status: "pending" | "claimed" | "running" | "succeeded" | "failed";
            attemptCount: number;
            lastError: string | null;
            result?: unknown;
            scheduledAt: string;
            finishedAt: string | null;
        };
        PlatformClubDto: {
            /** Format: uuid */
            id: string;
            slug: string;
            name: string;
            ffbbClubId: string;
            /** @enum {string} */
            status: "active" | "suspended";
            ffbb: boolean;
            fbi: boolean;
            emarque: boolean;
        };
        CreateClubDto: {
            name: string;
            ffbbClubId: string;
            slug?: string;
            timezone?: string;
            /** Format: email */
            adminEmail?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
