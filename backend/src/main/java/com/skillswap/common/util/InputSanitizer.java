package com.skillswap.common.util;

import java.util.regex.Pattern;

/**
 * Utility for input sanitization, XSS defense, and text normalization.
 */
public final class InputSanitizer {

    private static final Pattern SCRIPT_TAG_PATTERN = Pattern.compile(
            "<script[^>]*>(.*?)</script>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private static final Pattern HTML_TAG_PATTERN = Pattern.compile(
            "<[^>]+>",
            Pattern.DOTALL
    );

    private static final Pattern JAVASCRIPT_SCHEME_PATTERN = Pattern.compile(
            "(?i)javascript:|vbscript:|data:text/html",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EVENT_HANDLER_PATTERN = Pattern.compile(
            "(?i)\\bon\\w+\\s*=",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CONTROL_CHARS_PATTERN = Pattern.compile(
            "[\\p{Cntrl}&&[^\r\n\t]]"
    );

    private InputSanitizer() {
        // Utility class
    }

    /**
     * Sanitizes user input by removing script tags, all HTML tags, javascript pseudo-protocols,
     * DOM event handlers, and non-printable control characters.
     *
     * @param input the raw string
     * @return the sanitized string, or null if input was null
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }

        String cleaned = input;

        // Remove script tags and their content
        cleaned = SCRIPT_TAG_PATTERN.matcher(cleaned).replaceAll("");

        // Remove any other HTML tags
        cleaned = HTML_TAG_PATTERN.matcher(cleaned).replaceAll("");

        // Remove javascript / vbscript / dangerous protocols
        cleaned = JAVASCRIPT_SCHEME_PATTERN.matcher(cleaned).replaceAll("");

        // Remove inline event handlers (e.g., onclick=, onload=)
        cleaned = EVENT_HANDLER_PATTERN.matcher(cleaned).replaceAll("");

        // Remove unexpected control characters
        cleaned = CONTROL_CHARS_PATTERN.matcher(cleaned).replaceAll("");

        return cleaned.trim();
    }

    /**
     * Sanitizes and limits the input to a maximum length.
     *
     * @param input the raw string
     * @param maxLength the maximum allowable characters
     * @return the sanitized and truncated string, or null if input was null
     */
    public static String sanitize(String input, int maxLength) {
        String cleaned = sanitize(input);
        if (cleaned == null) {
            return null;
        }
        if (cleaned.length() > maxLength) {
            return cleaned.substring(0, maxLength).trim();
        }
        return cleaned;
    }

    /**
     * Escapes standard HTML special characters (&, <, >, ", ') into HTML entities.
     *
     * @param input the raw string
     * @return the HTML entity-encoded string, or null if input was null
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return null;
        }
        StringBuilder out = new StringBuilder(Math.max(16, input.length()));
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '&':
                    out.append("&amp;");
                    break;
                case '<':
                    out.append("&lt;");
                    break;
                case '>':
                    out.append("&gt;");
                    break;
                case '"':
                    out.append("&quot;");
                    break;
                case '\'':
                    out.append("&#x27;");
                    break;
                default:
                    out.append(c);
                    break;
            }
        }
        return out.toString();
    }
}
