package com.mobi.document.translator.cli;

import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.impl.xml.XmlStackingSemanticTranslator;
import com.mobi.document.translator.stack.impl.json.JsonStackingSemanticTranslator;
import com.mobi.persistence.utils.impl.SimpleSesameTransformer;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;


public class DocumentTranslationCLITest extends OrmEnabledTestCase {

    private DocumentTranslationCLI cli;

    @Before
    public void initCli() throws Exception {
        cli = new DocumentTranslationCLI();
        injectOrmFactoryReferencesIntoService(cli);
        injectTranslators();
        getField(cli.getClass(), "valueFactory").set(cli, VALUE_FACTORY);
        getField(cli.getClass(), "modelFactory").set(cli, MODEL_FACTORY);
        getField(cli.getClass(), "ormFactoryRegistry").set(cli, ORM_FACTORY_REGISTRY);
        getField(cli.getClass(), "sesameTransformer").set(cli, new SimpleSesameTransformer());
    }

    private void injectTranslators() throws Exception {
        DefaultIriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        injectOrmFactoryReferencesIntoService(processor);
        processor.setValueFactory(VALUE_FACTORY);

        JsonStackingSemanticTranslator json = new JsonStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(json);
        json.setExpressionProcessor(processor);
        json.setModelFactory(MODEL_FACTORY);
        json.setValueFactory(VALUE_FACTORY);
        json.setOrmFactoryRegistry(ORM_FACTORY_REGISTRY);

        XmlStackingSemanticTranslator xml = new XmlStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(xml);
        xml.setExpressionProcessor(processor);
        xml.setModelFactory(MODEL_FACTORY);
        xml.setValueFactory(VALUE_FACTORY);
        xml.setOrmFactoryRegistry(ORM_FACTORY_REGISTRY);

        Field f = cli.getClass().getDeclaredField("translators");
        f.setAccessible(true);
        List<SemanticTranslator> translators = new ArrayList<>(2);
        translators.add(json);
        translators.add(xml);
        f.set(cli, translators);
    }

    @Test
    public void testSuccessJson() throws Exception {
        setArguments(cli, "src/test/resources/test.json", "target/jsonTest",
                "urn://json.ont/mobi", "json");
        cli.execute();
    }

    @Test
    public void testSuccessXml() throws Exception {
        setArguments(cli, "src/test/resources/test.xml", "target/xmlTest",
                "urn://xml.ont/mobi", "xml");
        cli.execute();
    }

    private static void setArguments(DocumentTranslationCLI cli, String documentFile, String outputDirectory,
                                     String ontologyIriString, String type) throws Exception {
        Class<?> clazz = cli.getClass();
        getField(clazz, "documentFile").set(cli, new File(documentFile));
        getField(clazz, "outputDirectory").set(cli, new File(outputDirectory));
        getField(clazz, "ontologyIriString").set(cli, ontologyIriString);
        getField(clazz, "type").set(cli, type);


    }

    private static Field getField(Class<?> clazz, String name) throws Exception {
        Field f = clazz.getDeclaredField(name);
        f.setAccessible(true);
        return f;
    }

}
