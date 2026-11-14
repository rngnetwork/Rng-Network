// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.common.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DotenvLoaderTest {

    private static final String TEST_KEY_1 = "TEST_DOTENV_KEY_ALPHA";
    private static final String TEST_KEY_2 = "TEST_DOTENV_KEY_BETA";
    private static final String TEST_KEY_3 = "TEST_DOTENV_KEY_GAMMA";
    private static final String TEST_KEY_EXISTING = "TEST_DOTENV_KEY_EXISTING";

    @AfterEach
    void tearDown() {
        System.clearProperty(TEST_KEY_1);
        System.clearProperty(TEST_KEY_2);
        System.clearProperty(TEST_KEY_3);
        System.clearProperty(TEST_KEY_EXISTING);
    }

    @Test
    @DisplayName("DotenvLoader has private constructor accessible via reflection")
    void testConstructor() throws Exception {
        Constructor<DotenvLoader> constructor = DotenvLoader.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        DotenvLoader instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }

    @Test
    @DisplayName("loadFile parses key-value pairs, trims quotes, and ignores comments and empty lines")
    void loadFile_parsesValidProperties(@TempDir Path tempDir) throws IOException {
        Path envFile = tempDir.resolve(".env");
        List<String> lines = List.of(
                "# This is a comment",
                "   # Indented comment",
                "",
                "   ",
                TEST_KEY_1 + "=simple_value",
                TEST_KEY_2 + "=\"double_quoted_value\"",
                TEST_KEY_3 + "='single_quoted_value'",
                "MALFORMED_LINE_NO_EQUALS",
                "=NO_KEY_LINE"
        );
        Files.write(envFile, lines);

        DotenvLoader.loadFile(envFile.toFile());

        assertThat(System.getProperty(TEST_KEY_1)).isEqualTo("simple_value");
        assertThat(System.getProperty(TEST_KEY_2)).isEqualTo("double_quoted_value");
        assertThat(System.getProperty(TEST_KEY_3)).isEqualTo("single_quoted_value");
    }

    @Test
    @DisplayName("loadFile does not overwrite properties already set in system")
    void loadFile_doesNotOverwriteExisting(@TempDir Path tempDir) throws IOException {
        System.setProperty(TEST_KEY_EXISTING, "pre_existing_value");

        Path envFile = tempDir.resolve(".env");
        Files.write(envFile, List.of(TEST_KEY_EXISTING + "=new_file_value"));

        DotenvLoader.loadFile(envFile.toFile());

        assertThat(System.getProperty(TEST_KEY_EXISTING)).isEqualTo("pre_existing_value");
    }

    @Test
    @DisplayName("loadFile handles non-existent file gracefully without throwing exception")
    void loadFile_whenFileNotFound_handlesGracefully() {
        File nonExistent = new File("non-existent-env-file-12345.env");
        DotenvLoader.loadFile(nonExistent);
        // Should catch IOException and log error without throwing
    }

    @Test
    @DisplayName("loadFile handles mismatched quotes and existing environment variables without throwing")
    void loadFile_handlesQuoteMismatchesAndEnvVars(@TempDir Path tempDir) throws IOException {
        Path envFile = tempDir.resolve(".env");
        List<String> lines = List.of(
                "MISMATCH_DOUBLE=\"only_start",
                "MISMATCH_SINGLE='only_start",
                "MISMATCH_END_DOUBLE=only_end\"",
                "MISMATCH_END_SINGLE=only_end'",
                "PATH=/should/not/overwrite/system/path"
        );
        Files.write(envFile, lines);

        DotenvLoader.loadFile(envFile.toFile());

        assertThat(System.getProperty("MISMATCH_DOUBLE")).isEqualTo("\"only_start");
        assertThat(System.getProperty("MISMATCH_SINGLE")).isEqualTo("'only_start");
        assertThat(System.getProperty("MISMATCH_END_DOUBLE")).isEqualTo("only_end\"");
        assertThat(System.getProperty("MISMATCH_END_SINGLE")).isEqualTo("only_end'");

        System.clearProperty("MISMATCH_DOUBLE");
        System.clearProperty("MISMATCH_SINGLE");
        System.clearProperty("MISMATCH_END_DOUBLE");
        System.clearProperty("MISMATCH_END_SINGLE");
    }

    @Test
    @DisplayName("load completes gracefully when candidates are evaluated and none exist")
    void load_executesSafely() {
        DotenvLoader.load();
    }

    @Test
    @DisplayName("load successfully loads .env when present in working directory")
    void load_whenEnvFilePresent_loadsVariables() throws IOException {
        File dotEnv = new File(".env");
        boolean created = false;
        try {
            if (!dotEnv.exists()) {
                Files.write(dotEnv.toPath(), List.of(TEST_KEY_1 + "=loaded_from_working_dir_env"));
                created = true;
            }
            DotenvLoader.load();
            assertThat(System.getProperty(TEST_KEY_1)).isEqualTo("loaded_from_working_dir_env");
        } finally {
            if (created && dotEnv.exists()) {
                Files.deleteIfExists(dotEnv.toPath());
            }
        }
    }

    @Test
    @DisplayName("load skips candidate if candidate is a directory instead of a regular file")
    void load_whenCandidateIsDirectory_skips() throws IOException {
        File dotEnvDir = new File(".env");
        boolean created = false;
        try {
            if (!dotEnvDir.exists()) {
                created = dotEnvDir.mkdir();
            }
            DotenvLoader.load();
        } finally {
            if (created && dotEnvDir.exists()) {
                Files.deleteIfExists(dotEnvDir.toPath());
            }
        }
    }
}
