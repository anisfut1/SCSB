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
    "/v1/clubs/{clubId}/matches/{matchId}/derogation": {
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
                /** @description Dernier état connu de la dérogation de ce match (null si aucune) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            derogation: components["schemas"]["DerogationStatusDto"];
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
    "/v1/clubs/{clubId}/matches/{matchId}/derogation/check": {
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
                /** @description Résultat immédiat de la vérification FBI de ce match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            found: boolean;
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
    "/v1/clubs/{clubId}/integrations/fbi/check-all-derogations": {
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
                /** @description Résultat immédiat de la vérification globale FBI */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            derogationsFound: number;
                            matched: number;
                            unmatched: number;
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
    "/v1/clubs/{clubId}/derogations": {
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
                /** @description Toutes les dérogations connues du club */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            derogations: components["schemas"]["DerogationListItemDto"][];
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
    "/v1/clubs/{clubId}/derogations/{derogationId}/respond": {
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
                    derogationId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RespondToDerogationDto"];
                };
            };
            responses: {
                /** @description Résultat RÉEL renvoyé par FBI (success/error/unknown) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RespondToDerogationResultDto"];
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
    "/v1/clubs/{clubId}/matches/{matchId}/derogation/respond": {
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
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RespondToDerogationDto"];
                };
            };
            responses: {
                /** @description Résultat RÉEL renvoyé par FBI (success/error/unknown) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RespondToDerogationResultDto"];
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
    "/v1/clubs/{clubId}/matches/{matchId}/table-suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    role: components["schemas"]["TableAssignmentRole"];
                };
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
                /** @description Candidats classés (recommandés/disponibles/indisponibles) pour ce rôle sur ce match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TableSuggestionsDto"];
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
    "/v1/clubs/{clubId}/matches/{matchId}/table-assignments/{role}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                    role: components["schemas"]["TableAssignmentRole"];
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["PutTableAssignmentDto"];
                };
            };
            responses: {
                /** @description Affectation enregistrée */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TableAssignmentResultDto"];
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
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                    role: components["schemas"]["TableAssignmentRole"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Affectation retirée (poste remis à 'À attribuer') */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            removed: true;
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/table-assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    from?: string;
                    to?: string;
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
                /** @description Matchs à domicile du club, avec leurs 4 postes (affectés ou 'à attribuer') */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TableAssignmentsListDto"];
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
    "/v1/clubs/{clubId}/matches/{matchId}/referee-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
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
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["PutRefereeStatusDto"];
                };
            };
            responses: {
                /** @description Statut arbitre enregistré */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RefereeStatusResultDto"];
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
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/table-assignments/public-access": {
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
                /** @description État des accès publics par licencié (revendiqué ou non) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicAccessListDto"];
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
    "/v1/clubs/{clubId}/table-assignments/public-access/{licencieId}/reset": {
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
                    licencieId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Accès public réinitialisé */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicAccessResetResultDto"];
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
    "/v1/public/clubs/{clubSlug}": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Infos club minimales (aucune donnée membre/rôle) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicClubDto"];
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
    "/v1/public/clubs/{clubSlug}/licencies": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Roster pour choisir son nom (`claimed` seulement, jamais qui) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicLicenciesListDto"];
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
    "/v1/public/clubs/{clubSlug}/licencies/{licencieId}/claim": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                    licencieId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ClaimLicencieDto"];
                };
            };
            responses: {
                /** @description Jeton personnel — renvoyé UNE SEULE FOIS, jamais récupérable ensuite */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClaimResultDto"];
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
                /** @description Déjà revendiqué */
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
    "/v1/public/clubs/{clubSlug}/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    token: string;
                };
                header?: never;
                path: {
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Identité résolue depuis le jeton */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicMeDto"];
                    };
                };
                /** @description Jeton invalide ou révoqué */
                401: {
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
    "/v1/public/clubs/{clubSlug}/table-assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    token: string;
                    from?: string;
                    to?: string;
                };
                header?: never;
                path: {
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Même contenu que la vue admin, avec `me` */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicTableAssignmentsListDto"];
                    };
                };
                /** @description Jeton invalide ou révoqué */
                401: {
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
    "/v1/public/clubs/{clubSlug}/matches/{matchId}/table-assignments/{role}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query: {
                    token: string;
                };
                header?: never;
                path: {
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                    matchId: string;
                    role: components["schemas"]["TableAssignmentRole"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Auto-affectation enregistrée */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicAssignResultDto"];
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
                /** @description Jeton invalide ou révoqué */
                401: {
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
                /** @description Conflit métier ou poste déjà occupé par quelqu'un d'autre */
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
        post?: never;
        delete: {
            parameters: {
                query: {
                    token: string;
                };
                header?: never;
                path: {
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                    matchId: string;
                    role: components["schemas"]["TableAssignmentRole"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Affectation retirée */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            removed: true;
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
                /** @description Jeton invalide ou révoqué */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Ce poste appartient à quelqu'un d'autre */
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public/clubs/{clubSlug}/teams": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Équipes du club (pour le filtre de la liste des matchs) */
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
    "/v1/public/clubs/{clubSlug}/matches": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Matchs du club (filtrés, paginés) — mêmes filtres que la route authentifiée */
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
    "/v1/public/clubs/{clubSlug}/matches/{matchId}": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Détail du match (composition, statistiques, officiels, e-Marque) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MatchDetailsDto"];
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
    "/v1/public/clubs/{clubSlug}/matches/{matchId}/documents": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Documents e-Marque du match — `downloadUrl` toujours `null` (jamais d'URL signée en public) */
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
    "/v1/public/clubs/{clubSlug}/matches/{matchId}/derogation": {
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
                    /** @description Slug du club (flux public sans compte) */
                    clubSlug: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Dernier état connu de la dérogation de ce match (null si aucune) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            derogation: components["schemas"]["DerogationStatusDto"];
                        };
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
    "/v1/clubs/{clubId}/matches/{matchId}/derogation/create": {
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
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreateDerogationDto"];
                };
            };
            responses: {
                /** @description Résultat RÉEL renvoyé par FBI (success/error/unknown) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreateDerogationResultDto"];
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
        delete: {
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
                /** @description Licencié supprimé */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DeleteLicencieResultDto"];
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
    "/v1/clubs/{clubId}/licencies/import": {
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
                    "application/json": components["schemas"]["ImportLicenciesDto"];
                };
            };
            responses: {
                /** @description Import terminé (total/inserted/skipped) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ImportLicenciesResultDto"];
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
    "/v1/clubs/{clubId}/licencies/auto-assign-teams": {
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
                /** @description Répartition terminée (total/assigned/skipped) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AutoAssignTeamsResultDto"];
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
    "/v1/platform/maintenance/purge-emarque-documents": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Purge terminée (idempotente, jamais destructive pour les stats déjà en base) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PurgeEmarqueDocumentsResultDto"];
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
    "/v1/platform/maintenance/delete-old-seasons": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["DeleteOldSeasonsDto"];
                };
            };
            responses: {
                /** @description Matchs des saisons précédentes supprimés (cascade FK sur toutes les données liées) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DeleteOldSeasonsResultDto"];
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
    "/v1/platform/maintenance/retry-failed-emarque-imports": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Nouvelle tentative terminée (réutilise le fichier déjà en Storage, jamais un nouveau téléchargement FBI) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RetryFailedEmarqueImportsResultDto"];
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
            /** @enum {string|null} */
            derogationStatus: "en_cours" | "acceptee" | "refusee" | null;
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
            purged: boolean;
        };
        DerogationStatusDto: {
            /** Format: uuid */
            id: string | null;
            numero: string | null;
            etat: string | null;
            dateDepot: string | null;
            dateDerogation: string | null;
            dateRencontre: string | null;
            heure: string | null;
            domicile: string | null;
            visiteur: string | null;
            demandeur: string | null;
            motif: string | null;
            dateRencontreDemandee: string | null;
            heureDemandee: string | null;
            adversaire: string | null;
            dateReponse: string | null;
            acceptation: string | null;
            motifRefus: string | null;
            checkedAt: string;
            actionRequired: boolean;
        } | null;
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
        FbiActiveJobDto: {
            /** @enum {string} */
            type: "test_connection" | "discover_emarque" | "reconcile_schedule" | "check_derogation" | "check_all_derogations";
            startedAt: string;
        };
        FbiIntegrationStatusDto: {
            configured: boolean;
            username: string | null;
            connected: boolean;
            lastLoginAt: string | null;
            autoImportEmarque: boolean;
            lastError: string | null;
            activeJob: components["schemas"]["FbiActiveJobDto"] | null;
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
        DerogationListItemDto: components["schemas"]["DerogationStatusDto"] & {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            matchId: string;
            opponentName: string | null;
            matchDatetime: string | null;
            categoryLabel: string | null;
            teamName: string | null;
            scheduleConflict: components["schemas"]["ScheduleConflictDto"];
        };
        ScheduleConflictDto: {
            /** Format: uuid */
            matchId: string;
            numero: string | null;
            opponentName: string | null;
            matchDatetime: string;
            teamName: string | null;
        } | null;
        RespondToDerogationResultDto: {
            /** @enum {string} */
            outcome: "success" | "error" | "unknown";
            message: string | null;
        };
        RespondToDerogationDto: {
            /** @enum {string} */
            decision: "accepted" | "refused";
            motifRefus?: string | null;
        };
        TableSuggestionsDto: {
            recommended: components["schemas"]["TableSuggestionCandidateDto"][];
            available: components["schemas"]["TableSuggestionCandidateDto"][];
            unavailable: components["schemas"]["TableUnavailableCandidateDto"][];
        };
        TableSuggestionCandidateDto: {
            licencie: components["schemas"]["TableLicencieRefDto"];
            teams: components["schemas"]["TableTeamRefDto"][];
            /** @enum {string} */
            eligibility: "RECOMMENDED" | "POTENTIALLY_AVAILABLE";
            priorityTier: components["schemas"]["PriorityTier"];
            score: number;
            reasons: components["schemas"]["SuggestionReasonDto"][];
            seasonAssignmentCount: number;
            sameDayAssignmentCount: number;
            isCurrentHolder: boolean;
        };
        TableLicencieRefDto: {
            /** Format: uuid */
            id: string;
            firstName: string;
            lastName: string;
        };
        TableTeamRefDto: {
            /** Format: uuid */
            id: string;
            name: string;
        };
        /** @enum {string} */
        PriorityTier: "ADJACENT_NEXT_HOME" | "ADJACENT_PREVIOUS_HOME" | "AVAILABLE_OTHER";
        SuggestionReasonDto: {
            code: components["schemas"]["SuggestionReasonCode"];
            label: string;
        };
        /** @enum {string} */
        SuggestionReasonCode: "NEXT_HOME_MATCH" | "PREVIOUS_HOME_MATCH" | "SAME_VENUE" | "SEASON_DUTY_COUNT";
        TableUnavailableCandidateDto: {
            licencie: components["schemas"]["TableLicencieRefDto"];
            teams: components["schemas"]["TableTeamRefDto"][];
            /** @enum {string} */
            eligibility: "UNAVAILABLE";
            reasonCode: components["schemas"]["UnavailableReasonCode"];
            reason: string;
            /** Format: uuid */
            conflictingMatchId: string | null;
        };
        /** @enum {string} */
        UnavailableReasonCode: "MATCH_CONFLICT" | "TABLE_ASSIGNMENT_CONFLICT" | "ALREADY_ASSIGNED_ON_MATCH";
        /** @enum {string} */
        TableAssignmentRole: "SCORER" | "TIMEKEEPER" | "CLUB_DELEGATE" | "REFEREE";
        TableAssignmentResultDto: {
            assignment: components["schemas"]["TableAssignmentSlotDto"];
        };
        TableAssignmentSlotDto: {
            /** Format: uuid */
            id: string;
            licencie: components["schemas"]["TableLicencieRefDto"];
            teams: components["schemas"]["TableTeamRefDto"][];
            hasConflict: boolean;
            conflictReason: string | null;
        };
        PutTableAssignmentDto: {
            /** Format: uuid */
            licencieId: string;
        };
        TableAssignmentsListDto: {
            matches: components["schemas"]["TableAssignmentsForMatchDto"][];
        };
        TableAssignmentsForMatchDto: {
            match: components["schemas"]["TableMatchRefDto"];
            assignments: {
                scorer: components["schemas"]["TableAssignmentSlotDto"] & unknown;
                timekeeper: components["schemas"]["TableAssignmentSlotDto"] & unknown;
                clubDelegate: components["schemas"]["TableAssignmentSlotDto"] & unknown;
                referee: components["schemas"]["TableAssignmentSlotDto"] & unknown;
            };
            refereeNotNeeded: boolean;
            hasConflict: boolean;
        };
        TableMatchRefDto: {
            /** Format: uuid */
            id: string;
            numero: string | null;
            matchDatetime: string | null;
            teamName: string | null;
            opponentName: string | null;
            venueLabel: string | null;
        };
        RefereeStatusResultDto: {
            refereeNotNeeded: boolean;
        };
        PutRefereeStatusDto: {
            noRefereeNeeded: boolean;
        };
        PublicAccessListDto: {
            entries: components["schemas"]["PublicAccessEntryDto"][];
        };
        PublicAccessEntryDto: {
            licencie: components["schemas"]["TableLicencieRefDto"];
            claimed: boolean;
            email: string | null;
            claimedAt: string | null;
        };
        PublicAccessResetResultDto: {
            /** @enum {boolean} */
            reset: true;
        };
        PublicClubDto: {
            slug: string;
            name: string;
            logoUrl: string | null;
            timezone: string;
        };
        PublicLicenciesListDto: {
            licencies: components["schemas"]["PublicLicencieDto"][];
        };
        PublicLicencieDto: {
            /** Format: uuid */
            id: string;
            firstName: string;
            lastName: string;
            claimed: boolean;
        };
        ClaimResultDto: {
            token: string;
            licencie: components["schemas"]["TableLicencieRefDto"];
        };
        ClaimLicencieDto: {
            /** Format: email */
            email?: string | null;
        };
        PublicMeDto: {
            licencie: components["schemas"]["TableLicencieRefDto"];
        };
        PublicTableAssignmentsListDto: {
            me: components["schemas"]["TableLicencieRefDto"];
            matches: components["schemas"]["PublicTableAssignmentsForMatchDto"][];
        };
        PublicTableAssignmentsForMatchDto: {
            match: components["schemas"]["TableMatchRefDto"];
            assignments: {
                scorer: components["schemas"]["TableAssignmentSlotDto"] & unknown;
                timekeeper: components["schemas"]["TableAssignmentSlotDto"] & unknown;
                clubDelegate: components["schemas"]["TableAssignmentSlotDto"] & unknown;
                referee: components["schemas"]["TableAssignmentSlotDto"] & unknown;
            };
            refereeNotNeeded: boolean;
            hasConflict: boolean;
        };
        PublicAssignResultDto: {
            assignment: components["schemas"]["TableAssignmentSlotDto"];
        };
        CreateDerogationResultDto: {
            /** @enum {string} */
            outcome: "success" | "error" | "unknown";
            message: string | null;
        };
        CreateDerogationDto: {
            motif: string;
            modifierDate: boolean;
            dateDerogation?: string | null;
            modifierHoraire: boolean;
            horaire?: string | null;
            inverserRencontre: boolean;
            inverserEquipe: boolean;
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
            ffbbLicenceId: string | null;
            categoryLabel: string | null;
            /** @enum {string|null} */
            sexe: "M" | "F" | null;
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
        ImportLicenciesResultDto: {
            total: number;
            inserted: number;
            skipped: number;
        };
        ImportLicenciesDto: {
            licencies: {
                ffbbLicenceId: string;
                licenseNumber?: string | null;
                firstName: string;
                lastName: string;
                /** Format: date */
                birthDate?: string | null;
                categoryLabel?: string | null;
                /** @enum {string|null} */
                sexe?: "M" | "F" | null;
            }[];
        };
        AutoAssignTeamsResultDto: {
            total: number;
            assigned: number;
            skipped: number;
        };
        DeleteLicencieResultDto: {
            /** @enum {boolean} */
            deleted: true;
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
            status: "open" | "auto_corrected";
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
            type: "test_connection" | "discover_emarque" | "reconcile_schedule" | "check_derogation" | "check_all_derogations";
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
        PurgeEmarqueDocumentsResultDto: {
            documentsExamined: number;
            documentsPurged: number;
            errors: number;
        };
        DeleteOldSeasonsResultDto: {
            matchesDeleted: number;
            seasonStart: string;
        };
        DeleteOldSeasonsDto: {
            /** Format: uuid */
            clubId: string;
        };
        RetryFailedEmarqueImportsResultDto: {
            matchesExamined: number;
            matchesRetried: number;
            matchesSkippedNoFile: number;
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
