package org.matonto.ontology.core.utils;

import org.apache.commons.io.IOUtils;

import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.Charset;
import javax.annotation.Nonnull;

public class MatOntoStringUtils {

    /**
     * Obtains content of URL to String.
     */
    public static String urlToText(@Nonnull String url) throws Exception {
        URL website = new URL(url);
        URLConnection connection = website.openConnection();
        BufferedReader in = new BufferedReader(
                                new InputStreamReader(
                                    connection.getInputStream()));

        StringBuilder response = new StringBuilder();
        String inputLine;

        while ((inputLine = in.readLine()) != null) {
            response.append(inputLine + "\n");
        }
        in.close();

        return response.toString();
    }


    /**
     * Converts InputStream to String.
     */
    public static String inputStreamToText(@Nonnull InputStream inputStream) {
        BufferedReader br = null;
        StringBuilder sb = new StringBuilder();

        String line;
        try {
            br = new BufferedReader(new InputStreamReader(inputStream));
            while ((line = br.readLine()) != null) {
                sb.append(line + "\n");
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (br != null) {
                try {
                    br.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            IOUtils.closeQuietly(inputStream);
        }

        return sb.toString();
    }


    /*
     * Uses Regex to address the language tag issue in OWL2 RDF mapping  where
     * RDF-1.1 it is not allowed to have a datatype in the Turtle document
     * if you have a language. This one defaults the language tag to "@en"(English).
     */
    public static InputStream replaceLanguageTag(@Nonnull InputStream inputStream) {
        return replaceLanguageTag(inputStream, "en");
    }


    /**
     * Uses Regex to address the language tag issue in OWL2 RDF mapping  where
     * RDF-1.1 it is not allowed to have a datatype in the Turtle document
     * if you have a language.
     */
    public static InputStream replaceLanguageTag(@Nonnull InputStream inputStream, @Nonnull String languageSuffix) {
        InputStream result = null;
        String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
        String replaceWith = "xml:lang=\"" + languageSuffix + "\"";
        String content = inputStreamToText(inputStream);
        content = content.replaceAll(toReplace, replaceWith);
        result = new ByteArrayInputStream(content.getBytes( ));
        return result;
    }


    public static OutputStream replaceLanguageTag(@Nonnull OutputStream outputStream) {
        return replaceLanguageTag(outputStream, "en");
    }

    /**
     * .
     */
    public static OutputStream replaceLanguageTag(@Nonnull OutputStream outputStream, @Nonnull String languageSuffix) {
        OutputStream result = new ByteArrayOutputStream();
        String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
        String replaceWith = "xml:lang=\"" + languageSuffix + "\"";
        String content = outputStream.toString();
        content = content.replaceAll(toReplace, replaceWith);
        try {
            result.write(content.getBytes(Charset.forName("UTF-8")));

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        return result;
    }


    /**
     * Removes OWLAPI signature at the end of ontology document.
     */
    public static OutputStream removeOWLGeneratorSignature(@Nonnull OutputStream outputStream) {
        OutputStream result = new ByteArrayOutputStream();
        String signature = "<\\!--.*?OWL API.*?-->|#\\##.*?OWL API.*";
        String content = outputStream.toString();
        content = content.replaceAll(signature, "");

        try {
            result.write(content.getBytes(Charset.forName("UTF-8")));

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        return result;
    }
}
